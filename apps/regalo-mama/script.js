/**
 * Tribute Video Cinema Experience - Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const giftModal = document.getElementById('gift-modal');
  const openGiftBtn = document.getElementById('open-gift-btn');
  const videoWrapper = document.getElementById('video-wrapper');
  const video = document.getElementById('main-video');
  const playOverlay = document.getElementById('play-overlay');
  const btnBigPlay = document.getElementById('btn-big-play');
  
  const btnPlayPause = document.getElementById('btn-play-pause');
  const iconPlay = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');
  
  const btnReplay10 = document.getElementById('btn-replay-10');
  const btnForward10 = document.getElementById('btn-forward-10');
  
  const timeCurrent = document.getElementById('time-current');
  const timeDuration = document.getElementById('time-duration');
  
  const progressContainer = document.getElementById('progress-container');
  const progressFilled = document.getElementById('progress-filled');
  const progressBuffered = document.getElementById('progress-buffered');
  const progressThumb = document.getElementById('progress-thumb');
  
  const btnVolume = document.getElementById('btn-volume');
  const iconVolHigh = document.getElementById('icon-vol-high');
  const iconVolMute = document.getElementById('icon-vol-mute');
  const volumeSlider = document.getElementById('volume-slider');
  
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const iconFsEnter = document.getElementById('icon-fs-enter');
  const iconFsExit = document.getElementById('icon-fs-exit');
  
  const btnCelebrateTop = document.getElementById('btn-celebrate-top');
  const btnFireworks = document.getElementById('btn-fireworks');
  const chapterCards = document.querySelectorAll('.chapter-card');
  const ambientGlow = document.getElementById('ambient-glow');

  // =========================================================================
  // Canvas Particles & Confetti System
  // =========================================================================
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(x, y, type = 'bokeh') {
      this.x = x || Math.random() * canvas.width;
      this.y = y || Math.random() * canvas.height;
      this.type = type; // 'bokeh', 'heart', 'confetti'
      
      if (type === 'bokeh') {
        this.size = Math.random() * 6 + 2;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -Math.random() * 0.5 - 0.2;
        this.alpha = Math.random() * 0.6 + 0.2;
        this.color = Math.random() > 0.4 ? '243, 182, 85' : '244, 63, 94';
        this.life = 1;
        this.decay = Math.random() * 0.002 + 0.001;
      } else if (type === 'confetti') {
        this.size = Math.random() * 8 + 4;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 3;
        this.gravity = 0.18;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.008;
        const colors = ['#f3b655', '#f43f5e', '#fb923c', '#e11d48', '#ffd700', '#ffffff'];
        this.hexColor = colors[Math.floor(Math.random() * colors.length)];
        this.rotation = Math.random() * 360;
        this.rotSpeed = (Math.random() - 0.5) * 10;
      } else if (type === 'heart') {
        this.size = Math.random() * 16 + 12;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -Math.random() * 3 - 1.5;
        this.alpha = 1;
        this.decay = Math.random() * 0.01 + 0.005;
        this.color = Math.random() > 0.3 ? '#f43f5e' : '#fb7185';
      }
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.type === 'confetti') {
        this.vy += this.gravity;
        this.rotation += this.rotSpeed;
      }
      
      this.alpha -= this.decay;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);

      if (this.type === 'bokeh') {
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'confetti') {
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.hexColor;
        ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
      } else if (this.type === 'heart') {
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px serif`;
        ctx.fillText('❤️', 0, 0);
      }

      ctx.restore();
    }
  }

  // Populate initial ambient bokeh
  for (let i = 0; i < 28; i++) {
    particles.push(new Particle(null, null, 'bokeh'));
  }

  function launchCelebration(x, y, count = 60) {
    const originX = x || window.innerWidth / 2;
    const originY = y || window.innerHeight / 2;
    
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(originX, originY, Math.random() > 0.25 ? 'confetti' : 'heart'));
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();

      if (p.alpha <= 0 || p.y > canvas.height + 20) {
        particles.splice(i, 1);
        // Replace ambient bokeh
        if (p.type === 'bokeh') {
          particles.push(new Particle(null, canvas.height + 10, 'bokeh'));
        }
      }
    }

    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // =========================================================================
  // Gift Opening Reveal
  // =========================================================================
  openGiftBtn.addEventListener('click', () => {
    // Launch fireworks
    launchCelebration(window.innerWidth / 2, window.innerHeight / 2, 90);
    
    // Smooth transition
    giftModal.style.transform = 'scale(1.1)';
    giftModal.style.opacity = '0';
    setTimeout(() => {
      giftModal.classList.remove('active');
    }, 500);

    // Auto-play video
    playVideo();
  });

  // Celebrate buttons
  btnCelebrateTop.addEventListener('click', (e) => {
    const rect = btnCelebrateTop.getBoundingClientRect();
    launchCelebration(rect.left + rect.width / 2, rect.bottom, 50);
  });

  btnFireworks.addEventListener('click', (e) => {
    const rect = btnFireworks.getBoundingClientRect();
    launchCelebration(rect.left + rect.width / 2, rect.top, 70);
  });

  // =========================================================================
  // Video Player Controls & Sync
  // =========================================================================

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function playVideo() {
    video.play().then(() => {
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');
      playOverlay.classList.add('hidden');
      videoWrapper.classList.remove('paused');
      ambientGlow.style.opacity = '1';
    }).catch(err => {
      console.log('Autoplay handled:', err);
    });
  }

  function pauseVideo() {
    video.pause();
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
    playOverlay.classList.remove('hidden');
    videoWrapper.classList.add('paused');
    ambientGlow.style.opacity = '0.5';
  }

  function togglePlay() {
    if (video.paused || video.ended) {
      playVideo();
    } else {
      pauseVideo();
    }
  }

  // Click bindings
  btnPlayPause.addEventListener('click', togglePlay);
  btnBigPlay.addEventListener('click', togglePlay);
  playOverlay.addEventListener('click', togglePlay);
  video.addEventListener('click', togglePlay);

  btnReplay10.addEventListener('click', () => {
    video.currentTime = Math.max(0, video.currentTime - 10);
  });

  btnForward10.addEventListener('click', () => {
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
  });

  // Time & Progress Update
  video.addEventListener('timeupdate', () => {
    const cur = video.currentTime;
    const dur = video.duration || 81.5;
    
    timeCurrent.textContent = formatTime(cur);
    timeDuration.textContent = formatTime(dur);

    const percent = (cur / dur) * 100;
    progressFilled.style.width = `${percent}%`;
    progressThumb.style.left = `${percent}%`;

    // Trigger birthday confetti on reaching the final screen (around 74s)
    if (cur >= 74.0 && cur <= 74.5) {
      launchCelebration(window.innerWidth / 2, window.innerHeight * 0.4, 40);
    }
  });

  video.addEventListener('progress', () => {
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const dur = video.duration || 81.5;
      progressBuffered.style.width = `${(bufferedEnd / dur) * 100}%`;
    }
  });

  video.addEventListener('ended', () => {
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
    playOverlay.classList.remove('hidden');
    videoWrapper.classList.add('paused');
    launchCelebration(window.innerWidth / 2, window.innerHeight / 2, 80);
  });

  // Seeking on progress bar
  progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * (video.duration || 81.5);
  });

  // Milestone clicks
  document.querySelectorAll('.milestone').forEach(m => {
    m.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetTime = parseFloat(m.dataset.time);
      if (!isNaN(targetTime)) {
        video.currentTime = targetTime;
        playVideo();
      }
    });
  });

  // Chapter card clicks
  chapterCards.forEach(card => {
    card.addEventListener('click', () => {
      const targetTime = parseFloat(card.dataset.time);
      if (!isNaN(targetTime)) {
        video.currentTime = targetTime;
        playVideo();
        
        // Visual feedback
        card.style.transform = 'scale(0.97)';
        setTimeout(() => {
          card.style.transform = '';
        }, 200);

        if (card.classList.contains('highlight-card')) {
          launchCelebration(window.innerWidth / 2, window.innerHeight * 0.5, 60);
        }
      }
    });
  });

  // Volume slider
  volumeSlider.addEventListener('input', (e) => {
    video.volume = parseFloat(e.target.value);
    video.muted = (video.volume === 0);
    updateVolumeIcons();
  });

  btnVolume.addEventListener('click', () => {
    video.muted = !video.muted;
    if (video.muted) {
      volumeSlider.value = 0;
    } else {
      volumeSlider.value = video.volume || 1;
    }
    updateVolumeIcons();
  });

  function updateVolumeIcons() {
    if (video.muted || video.volume === 0) {
      iconVolHigh.classList.add('hidden');
      iconVolMute.classList.remove('hidden');
    } else {
      iconVolHigh.classList.remove('hidden');
      iconVolMute.classList.add('hidden');
    }
  }

  // Fullscreen
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      if (videoWrapper.requestFullscreen) {
        videoWrapper.requestFullscreen();
      } else if (videoWrapper.webkitRequestFullscreen) {
        videoWrapper.webkitRequestFullscreen();
      }
      iconFsEnter.classList.add('hidden');
      iconFsExit.classList.remove('hidden');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      iconFsEnter.classList.remove('hidden');
      iconFsExit.classList.add('hidden');
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      iconFsEnter.classList.remove('hidden');
      iconFsExit.classList.add('hidden');
    }
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Avoid interfering if focus is in an input
    if (e.target.tagName === 'INPUT') return;

    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.code === 'KeyF') {
      e.preventDefault();
      btnFullscreen.click();
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      btnVolume.click();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      video.currentTime = Math.max(0, video.currentTime - 5);
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      video.currentTime = Math.min(video.duration, video.currentTime + 5);
    }
  });
});
