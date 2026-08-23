/**
 * Music Player Script
 * 处理文章中嵌入的音乐播放器的交互和自动播放
 * 支持直接URL和Meting API（网易云音乐、QQ音乐等）
 */

(function() {
    'use strict';
    
    // Meting API 配置
    const METING_API = "https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r";
    const METING_FALLBACK_APIS = [
        "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
        "https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
    ];
    
    // 存储所有活跃的播放器实例
    const activePlayers = new Set();
    
    function pauseAllPlayers() {
        activePlayers.forEach(function(player) {
            if (player._audio && !player._audio.paused) {
                player._audio.pause();
            }
        });
    }
    
    function cleanupAllPlayers() {
        activePlayers.forEach(function(player) {
            if (player._audio) {
                player._audio.pause();
                player._audio.removeAttribute('src');
                player._audio.load();
            }
        });
        activePlayers.clear();
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        initMusicPlayers();
    });
    
    window.addEventListener('beforeunload', pauseAllPlayers);
    
    document.addEventListener('swup:willReplaceContent', pauseAllPlayers);
    document.addEventListener('swup:contentReplaced', function() {
        cleanupAllPlayers();
        setTimeout(initMusicPlayers, 100);
    });
    
    document.addEventListener('astro:before-preparation', pauseAllPlayers);
    document.addEventListener('astro:page-load', function() {
        cleanupAllPlayers();
        initMusicPlayers();
    });
    
    async function fetchMetingData(server, type, id) {
        const apis = [METING_API, ...METING_FALLBACK_APIS];
        
        for (let i = 0; i < apis.length; i++) {
            const apiTemplate = apis[i];
            const url = apiTemplate
                .replace(':server', server)
                .replace(':type', type)
                .replace(':id', id)
                .replace(':r', Math.random());
            
            try {
                const response = await fetch(url);
                if (!response.ok) continue;
                
                const data = await response.json();
                
                if (Array.isArray(data) && data.length > 0) {
                    const song = data[0];
                    return {
                        url: song.url,
                        title: song.title || song.name,
                        artist: song.author || song.artist,
                        pic: song.pic || song.cover || song.artwork || song.image || "",
                        lrc: song.lrc
                    };
                } else if (data && typeof data === 'object' && data.url) {
                    return {
                        url: data.url,
                        title: data.title || data.name,
                        artist: data.author || data.artist,
                        pic: data.pic || data.cover || data.artwork || data.image || "",
                        lrc: data.lrc
                    };
                }
            } catch (e) {
                continue;
            }
        }
        
        throw new Error('所有Meting API都失败了');
    }
    
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return min + ':' + (sec < 10 ? '0' : '') + sec;
    }
    
    function updateCoverImage(player, picUrl) {
        if (!picUrl) return;
        
        const cover = player.querySelector('.music-player-cover');
        if (cover) {
            cover.style.backgroundImage = `url(${picUrl})`;
            cover.style.backgroundColor = 'transparent';
        }
    }
    
    function initMusicPlayers() {
        const players = document.querySelectorAll('.music-player-container');
        
        players.forEach(function(player) {
            if (player.dataset.initialized === 'true') return;
            player.dataset.initialized = 'true';
            activePlayers.add(player);
            
            const url = player.dataset.url;
            const server = player.dataset.server;
            const id = player.dataset.id;
            const type = player.dataset.type || 'song';
            const useMeting = player.dataset.useMeting === 'true';
            let title = player.dataset.title;
            let artist = player.dataset.artist;
            const cover = player.dataset.cover;
            const autoplay = player.dataset.autoplay === 'true';
            const loop = player.dataset.loop === 'true';
            const volume = parseFloat(player.dataset.volume) || 0.7;
            
            const audio = new Audio();
            audio.volume = volume;
            audio.loop = loop;
            audio.preload = 'none';
            // audio.crossOrigin = 'anonymous'; // 移除跨域设置
            
            const playBtn = player.querySelector('.music-play-btn');
            const playIcon = player.querySelector('.play-icon');
            const pauseIcon = player.querySelector('.pause-icon');
            const progressBar = player.querySelector('.music-progress-bar');
            const progress = player.querySelector('.music-progress');
            const currentTimeEl = player.querySelector('.current-time');
            const durationEl = player.querySelector('.duration');
            const volumeBtn = player.querySelector('.music-volume-btn');
            const volumeSlider = player.querySelector('.music-volume-slider');
            const volumeIcon = player.querySelector('.volume-icon');
            const muteIcon = player.querySelector('.mute-icon');
            const titleEl = player.querySelector('.music-player-title');
            const artistEl = player.querySelector('.music-player-artist');
            
            function updatePlayButton() {
                if (audio.paused) {
                    playIcon.classList.remove('hidden');
                    pauseIcon.classList.add('hidden');
                    playBtn.classList.remove('playing');
                } else {
                    playIcon.classList.add('hidden');
                    pauseIcon.classList.remove('hidden');
                    playBtn.classList.add('playing');
                }
            }
            
            function updateVolumeButton() {
                if (audio.muted || audio.volume === 0) {
                    volumeIcon.classList.add('hidden');
                    muteIcon.classList.remove('hidden');
                } else {
                    volumeIcon.classList.remove('hidden');
                    muteIcon.classList.add('hidden');
                }
            }
            
            function togglePlay() {
                if (audio.paused) {
                    activePlayers.forEach(function(otherPlayer) {
                        if (otherPlayer !== player && otherPlayer._audio && !otherPlayer._audio.paused) {
                            otherPlayer._audio.pause();
                        }
                    });
                    audio.play().catch(function() {});
                } else {
                    audio.pause();
                }
            }
            
            function updateProgress() {
                if (audio.duration) {
                    const percent = (audio.currentTime / audio.duration) * 100;
                    progress.style.width = percent + '%';
                    currentTimeEl.textContent = formatTime(audio.currentTime);
                }
            }
            
            function seekTo(e) {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                audio.currentTime = percent * audio.duration;
            }
            
            function toggleMute() {
                audio.muted = !audio.muted;
                updateVolumeButton();
            }
            
            function setVolume() {
                audio.volume = volumeSlider.value;
                audio.muted = false;
                updateVolumeButton();
            }
            
            playBtn.addEventListener('click', togglePlay);
            audio.addEventListener('play', updatePlayButton);
            audio.addEventListener('pause', updatePlayButton);
            audio.addEventListener('timeupdate', updateProgress);
            audio.addEventListener('loadedmetadata', function() {
                durationEl.textContent = formatTime(audio.duration);
            });
              // 播放URL回退机制
              var currentTrackUrls = [];
              var currentTrackUrlIndex = 0;

              function tryPlayCurrentUrl() {
                  if (currentTrackUrlIndex >= currentTrackUrls.length) {
                      player.classList.add('error');
                      titleEl.textContent = '加载失败';
                      artistEl.textContent = '音频格式不支持或网络错误';
                      return;
                  }
                  audio.src = currentTrackUrls[currentTrackUrlIndex];
                  // 如果启用了自动播放，尝试播放
                  if (autoplay) {
                      audio.play().catch(function() {});
                  }
              }

              audio.addEventListener('error', function() {
                  if (currentTrackUrlIndex < currentTrackUrls.length - 1) {
                      currentTrackUrlIndex++;
                      console.warn('播放失败，尝试备用URL:', currentTrackUrls[currentTrackUrlIndex]);
                      tryPlayCurrentUrl();
                  } else {
                      player.classList.add('error');
                      titleEl.textContent = '加载失败';
                      artistEl.textContent = '音频格式不支持或网络错误';
                  }
            });
            audio.addEventListener('ended', function() {
                if (!loop) {
                    updatePlayButton();
                    progress.style.width = '0%';
                    currentTimeEl.textContent = '0:00';
                }
            });
            progressBar.addEventListener('click', seekTo);
            volumeBtn.addEventListener('click', toggleMute);
            volumeSlider.addEventListener('input', setVolume);
            
            updatePlayButton();
            updateVolumeButton();
            player._audio = audio;
            
            async function loadMusic() {
                try {
                    if (useMeting) {
                        player.classList.add('loading');
                        const songData = await fetchMetingData(server, type, id);
                        
                        if (songData.title) {
                            title = songData.title;
                            titleEl.textContent = title;
                        }
                        if (songData.artist) {
                            artist = songData.artist;
                            artistEl.textContent = artist;
                        }
                        if (songData.pic) {
                            updateCoverImage(player, songData.pic);
                        }
                        
                        if (songData.url) {
                            // 构建备用URL列表（类似主页播放器的回退机制）
                            currentTrackUrls = [songData.url];
                            currentTrackUrlIndex = 0;
                            
                            // 从URL中提取id和server参数，构建备用API的URL
                            var matchId = songData.url.match(/[?&]id=([^&]+)/);
                            var matchServer = songData.url.match(/[?&]server=([^&]+)/);
                            if (matchId && matchServer) {
                                METING_FALLBACK_APIS.forEach(function(fallback) {
                                    var fallbackUrl = fallback
                                        .replace(':server', matchServer[1])
                                        .replace(':type', 'url')
                                        .replace(':id', matchId[1]);
                                    if (currentTrackUrls.indexOf(fallbackUrl) === -1) {
                                        currentTrackUrls.push(fallbackUrl);
                                    }
                                });
                            }
                            
                            tryPlayCurrentUrl();
                        } else {
                            throw new Error('未获取到音乐URL');
                        }
                    } else {
                        if (!url) throw new Error('未提供音频URL');
                        audio.src = url;
                    }
                    
                    player.classList.remove('loading');
                    
                } catch (error) {
                    console.error('加载音乐失败:', error);
                    player.classList.remove('loading');
                    player.classList.add('error');
                    titleEl.textContent = '加载失败';
                    artistEl.textContent = error.message || '请检查网络连接';
                }
            }
            
            audio.addEventListener('play', function() {
                if (window.__fireflyMusic) {
                    const state = window.__fireflyMusic.getState();
                    if (state.isPlaying) {
                        window.__fireflyMusic.togglePlay();
                    }
                }
            });
            
            loadMusic();
        });
    }
})();



