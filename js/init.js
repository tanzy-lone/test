var swiper = new Swiper('.swiper-container', {
  speed: 1000,
  loop: true,
  autoplay: {
    //自动播放
    delay: 1500, //自动切换的时间间隔
    stopOnLastSlide: false, //切换到最后一个slide时停止自动切换
    disableOnInteraction: false, //用户操作后是否停止
    reverseDirection: false //方向切换
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev'
  },
  pagination: {
    spaceBetween: 30,
    el: '.swiper-pagination',
    clickable: true
  }
})
