let datebase = null;
export function getDB() {
  if (datebase) return datebase;
  datebase = wx.cloud.database({
    env: 'test-1c449d'
  });
  return datebase;
}

export const errorTips = () => {
  wx.showToast({
    title: '数据查询出错,请联系开发小哥定位问题',
    icon: 'none',
  });
}

export const dateFormat = () => {
  const D = new Date();
  const __day = D.getDate();
  const __month = D.getMonth() + 1;
  const __year = D.getFullYear();
  const payDate = `${__year}-${__month > 9 ? __month : `0${__month}`}-${__day > 9 ? __day : `0${__day}`}`;
  const payTime = D.toTimeString().split(' ')[0].substring(0, 5);
  return {
    month: __month,
    year: __year,
    payDate,
    payTime,
  }
}

/**
 * 获取OPENID
 */
export const getOpenId = async () => {
  const result = await wx.cloud.callFunction({
    name: 'login',
  }).catch((err) => {
    console.error(err);
  });
  if (!result || !result.result) {
    return null;
  }
  return result.result;
}
