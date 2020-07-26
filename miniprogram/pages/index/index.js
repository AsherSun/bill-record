//index.js
import { getDB, errorTips } from './../../utils/utils';
const db = getDB();
const app = getApp();

Page({
  openId: '',
  page: 0,
  data: {
    tabActive: 1,
    hasEditorMode: false,
    sourceData: [],
    dataTotal: 0,
    loading: true,
    loadedFinish: false,
    income: 0,
    awaitIncome: 0,
  },
  onLoad: function() {
    app.globalData.$on('userInfo', (userInfo) => {
      this.openId = userInfo.openid;
      this.getTotal();
      this.getAllDataInfo();
    });
  },
  onShow() {
    if (app.globalData && app.globalData.hasEdit) {
      this.page = 0;
      this.setData({
        tabActive: 1,
        loading: true,
        sourceData: [],
        loadedFinish: false,
      });
      this.getAllDataInfo();
      this.getTotal();
    }
  },
  /** 获取之前数据总价 */
  async getTotal() {
    const result = await db.collection('billPriceTotal').where({
      _openid: this.openId,
    }).get();
    if (!result || !result.data) return;
    if (result.data.length) {
      const { data: [ totalData ] } = result;
      this.setData({
        awaitIncome: totalData.awaitIncome / 100,
        income: totalData.income / 100,
      });
    }
  },
  /** 获取当前所有数据信息 */
  async getAllDataInfo() {
    const [source, total] = await Promise.all([
      this.queryDataList(),
      this.getListToatl(),
    ]).catch((e) => null);
    this.setData({
      dataTotal: total,
      sourceData: source,
      loading: false,
      loadedFinish: total === source.length,
    });
  },
  /** 获取数据总条数 */
  async getListToatl() {
    const { tabActive } = this.data;
    const result = await db.collection('billRecord').where({
      _openid: this.openId,
      billClassify: `${tabActive}`
    }).count().catch((e) => {
      console.error(e);
      errorTips();
    });
    if (!result || !result.total) {
      return 0;
    }
    return result.total;
  },
  /** 数据查询 */
  async queryDataList() {
    const { tabActive } = this.data;
    const result = await db.collection('billRecord')
      .skip(this.page)
      .orderBy('createdAt', 'desc')
      .where({
        _openid: this.openId,
        billClassify: `${tabActive}`
      })
      .get()
      .catch(errorTips);
    if (!result || !result.data) {
      errorTips();
      return [];
    }
    return result.data;
  },
  /**
   * 搜索
   */
  onSearch({detail: { value }}) {
    console.log('e', value);
  },
  /**
   * 是否编辑
   */
  onEditorBill() {
    const {hasEditorMode} = this.data;
    this.setData({
      hasEditorMode: !hasEditorMode,
    });
  },
  /**
   * 切换选项
   */
  onTabChange({currentTarget: {dataset: {active}}}) {
    this.page = 0;
    this.setData({
      tabActive: +active,
      loading: true,
      sourceData: [],
      dataTotal: 0,
    });
    this.getAllDataInfo();
  },
  /**
   * 跳转去记账页面
  */
  handleJumpToRecord() {
    wx.navigateTo({
      url: '/pages/createBill/index',
    });
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  async onReachBottom () {
    const { loadedFinish, sourceData, dataTotal } = this.data;
    if (loadedFinish) return;
    this.page += 1;
    this.setData({
      loading: true,
    });
    const result = await this.queryDataList();
    const newSource = sourceData.concat(result);
    this.setData({
      sourceData: newSource,
      loadedFinish: newSource.length >= dataTotal,
      loading: false,
    });
  },
})
