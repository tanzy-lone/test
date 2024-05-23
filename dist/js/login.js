window.onload = function () {
  const forget = document.querySelector('.forget_a')
  const username_ipt = document.querySelector('.username')
  const password_ipt = document.querySelector('.password')
  const login_btn = document.querySelectorAll('.login_btn')

  forget.addEventListener('click', () => {
    username_ipt.value = 'tanzylone'
    password_ipt.value = '123456'
  })

  login_btn[0].addEventListener('click', () => {
    if (username_ipt.value.trim() === 'tanzylone' && password_ipt.value === '123456') {
      alert('登录成功！即将跳转到首页')
      location.href = '../index.html'
      return
    }
    if (username_ipt.value.trim() === '') {
      alert('用户名不能为空')
      return
    }
    if (password_ipt.value === '') {
      alert('密码不能为空')
      return
    }
    if (password_ipt.value !== '123456') {
      alert('密码错误')
      return
    }
    alert('登录失败')
  })
  login_btn[1].addEventListener('click', () => {
    username_ipt.value = ''
    password_ipt.value = ''
  })
}
