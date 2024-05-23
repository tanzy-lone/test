const back_top = document.querySelector('.back_top ')
const back = back_top.querySelector('.back')
const header = document.querySelector('.main-header')
window.addEventListener('scroll', getScrollPosition)

function getScrollPosition() {
  var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
  if (scrollTop >= 200) {
    back_top.style.display = 'block'
  } else {
    back_top.style.display = 'none'
  }
  if (scrollTop >= 140) {
    header.style.position = 'sticky'
    header.style.top = '0'
    header.style.left = '0'
    header.style.right = '0'
    header.style.zIndex = '999'
    header.style.background = 'background: rgb(251,33,117)'
    header.style.background = 'linear-gradient(0deg, rgba(251,33,117,1) 0%, rgba(234,76,137,1) 100%)'
  } else {
    header.style.background = 'rgb(96,9,240)'
    header.style.background = 'linear-gradient(0deg, rgba(96,9,240,1) 0%, rgba(129,5,240,1) 100%)'
  }
}

back.addEventListener('click', () => {
  window.scrollTo(0, 0)
})
