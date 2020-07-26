// miniprogram/pages/createBill/index.js
import { getDB, dateFormat } from './../../utils/utils';
const db = getDB();
const {globalData} = getApp();
const classifySelectData = [
  {
    id: '1',
    name: '已结算',
  },
  {
    id: '2',
    name: '未结算',
  }
];
const paySelectData = [
  {
    id: '1',
    name: '微信',
  },
  {
    id: '2',
    name: '支付宝',
  },
  {
    id: '3',
    name: '现金',
  }
];
Page({
  totalData: null,
  /**
   * 页面的初始数据
   */
  data: {
    price: '',
    classifySelectData,
    paySelectData,
    billClassify: '',
    payType: '',
    description: '',
    startAt: '',
    endAt: '',
    payDate: '',
    payTime: '',
    gasoline: '',
    licensePlate: '',
    buyUserName: '',
  },

  handleChangeData({currentTarget: {dataset: {key}}, detail: {value}}) {
    let data = {};
    switch (key) {
      case 'billClassify':
        data = {
          payType: '',
          [key]: value,
        }
        break;
      default:
        data = {
          [key]: value,
        }
        break;
    }
    this.setData(data);
  },

  async handleSave() {
    const result = await this.submitData();
    if (result) return;
    wx.navigateBack({
      delta: 1,
    });
  },
  async handleAgainSave () {
    const result = await this.submitData();
    if (result) return;
    await this.getTotal();
    wx.showToast({
      title: '数据已保存成功～',
    });
    const dateInfo = dateFormat();
    this.setData({
      price: '',
      billClassify: '',
      payType: '',
      description: '',
      payDate: dateInfo.payDate,
      payTime: dateInfo.payTime,
      gasoline: '',
      licensePlate: '',
      buyUserName: '',
    });
  },
  /** 数据提交 */
  async submitData() {
    const {
      price,
      payType,
      billClassify,
      gasoline,
      licensePlate,
    } = this.data;
    if (!price) {
      wx.showToast({
        title: '请填写金额',
        icon: 'none',
      });
      return true;
    }
    if (!billClassify) {
      wx.showToast({
        title: '请选择账单分类',
        icon: 'none',
      });
      return true;
    }
    if (billClassify === '1' && !payType) {
      wx.showToast({
        title: '请选择支付方式',
        icon: 'none',
      });
      return true;
    }
    if (!gasoline) {
      wx.showToast({
        title: '请填写油量',
        icon: 'none',
      });
      return true;
    }
    if (!licensePlate) {
      wx.showToast({
        title: '请填写车牌号',
        icon: 'none',
      });
      return true;
    }
    wx.showLoading({
      title: '数据提交中...',
      mask: true,
    });
    const result = await Promise.all([
      this.addBillDataFromDB(),
      this.computedTotalDdata(),
    ]).catch((error) => {
      console.log('error', error);
      wx.showToast({
        title: '数据保存出错,请联系开发人员检查',
        icon: 'none',
      });
    });
    if (!result) {
      return true;
    }
    wx.hideLoading();
    globalData.hasEdit = true;
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initState();
    this.getTotal();
    
  },

  initState() {
    const DD = dateFormat();
    if (DD.month === 12) {
      year += 1;
    }
    this.setData({
      endAt: `${DD.year}-${DD.month}-15`,
      startAt: `${DD.year-2}-${DD.month}-15`,
      payDate: DD.payDate,
      payTime: DD.payTime,
    });
  },

  /** 获取之前数据总价 */
  async getTotal() {
    wx.showLoading({
      title: '正在获取数据...',
      mask: true,
    });
    const result = await db.collection('billPriceTotal').get();
    wx.hideLoading();
    if (!result || !result.data) return;
    if (result.data.length) {
      this.totalData = result.data[0];
    }
  },

  /** 添加账单记录 */
  async addBillDataFromDB() {
    const {
      price,
      payType,
      billClassify,
      description,
      payDate,
      payTime,
      gasoline,
      licensePlate,
      buyUserName,
    } = this.data;
    const result = await db.collection('billRecord').add({
      data: {
        price: price * 100,
        payType,
        billClassify,
        description,
        date: `${payDate} ${payTime}`,
        gasoline: gasoline * 100,
        licensePlate: licensePlate,
        buyUserName,
        createdAt: db.serverDate(),
      }
    });
    if (!result || !result.errMsg ||!~result.errMsg.indexOf('ok')) {
      return Promise.reject('add bill record error');
    }
  },

  /** 计算账单所有金额 */
  async computedTotalDdata() {
    let result = false;
    if (this.totalData) {
      result = await this.updateBillTotalPrice();
    } else {
      result = await this.createdBillTotalPrice();
    }
    if (result) {
      return Promise.reject(this.totalData ? 'price total update error' : 'price total create error');
    }
  },

  /** 更新账单总金额 */
  async updateBillTotalPrice() {
    const { _id, allTotal, awaitIncome, income } = this.totalData;
    if (!allTotal || !_id) {
      return true;
    }
    const { price, billClassify } = this.data;
    let newTotal = price * 100 + allTotal;
    let newIncome = income;
    let newAwaitIncome = awaitIncome;
    if (billClassify === '1') {
      newIncome += price * 100;
    } else {
      newAwaitIncome += price * 100;
    }
    const result = await db.collection('billPriceTotal').doc(_id).update({
      data: {
        allTotal: newTotal,
        income: newIncome,
        awaitIncome: newAwaitIncome,
        updatedAt: db.serverDate(),
      },
    });
    if (!result || !result.stats) {
      return true;
    }
  },
  /** 创建新的账单总金额记录 */
  async createdBillTotalPrice() {
    const { price, billClassify } = this.data;
    const result = await db.collection('billPriceTotal').add({
      data: {
        allTotal: price * 100,
        income: billClassify === '1' && price * 100 || 0,
        awaitIncome: billClassify === '2' && price * 100 || 0,
        createdAt: db.serverDate(),
      }
    });
    if (!result || !result.errMsg ||!~result.errMsg.indexOf('ok')) {
      return true;
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})