window.onload = () => {
  const dialog = document.createElement('div')
  const msg = document.createElement('div')
  const welcome = document.createElement('p')
  const info = document.createElement('p')
  const hook_icon = document.createElement('i')
  const close_icon = document.createElement('i')
  const number = document.querySelectorAll('.number span')
  welcome.innerHTML = '欢迎回来~'
  info.innerHTML = getCurrTime()
  hook_icon.classList.add('iconfont', 'icon-icon_Hook', 'icon_hook')
  close_icon.classList.add('iconfont', 'icon-error', 'icon_close')
  dialog.classList.add('rightP')
  msg.classList.add('msg')
  welcome.classList.add('welcome')

  msg.append(welcome, info)
  dialog.append(msg, hook_icon, close_icon)
  document.body.append(dialog)

  if (dialog) {
    setTimeout(() => {
      dialog.classList.add('remove')
    }, 6000)
  }

  close_icon.addEventListener('click', () => {
    dialog.classList.add('remove')
  })

  const options = {
    //默认使用缓和，临近结束缓慢跳动
    useEasing: true, //默认使用分组
    useGrouping: true, //千位分隔器，可为空
    separator: ',', //十进制，可为空
    decimal: '.',
    //前缀
    prefix: '粉丝',
    //后缀
    suffix: ''
  }
  for (let i = 0; i < number.length; i++) {
    const demo = new CountUp(number[i], 0, number[i].innerHTML, 0, 2.5, options)
    console.log('demo', demo)
    if (!demo.error) {
      demo.start()
    } else {
      console.error(demo.error)
    }
  }
}
