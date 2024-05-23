function getCurrTime() {
  // 获取当前时间
  let timeNow = new Date()
  // 获取当前小时
  let hours = timeNow.getHours()
  if (hours >= 6 && hours <= 10) return `早上好⛅贾老师，今天依旧是开心的一天！`
  if (hours >= 10 && hours <= 14) return `中午好🌻贾老师，此刻吃饭、睡觉、打豆豆。`
  if (hours >= 14 && hours <= 18) return `下午好🌞贾老师，尽情享受今天的美好时光。`
  if (hours >= 18 && hours <= 24) return `晚上好🌇贾老师，注意早点休息哟！`
  if (hours >= 0 && hours <= 6) return `凌晨好🌃贾老师，注意不要熬夜哟！`
}
