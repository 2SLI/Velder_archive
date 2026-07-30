;(function(window) {

	'use strict';

	var DOM = {
		loader: document.querySelector('.overlay--loader'),
		stage: document.querySelector('.container'),
		scroller: document.querySelector('.container > .scroller'),
		content: document.querySelector('.content')
	};

	DOM.rooms = [].slice.call(DOM.scroller.querySelectorAll('.room'));
	DOM.slides = [].slice.call(DOM.content.querySelectorAll('.slides > .slide'));
	DOM.photoImages = [].slice.call(DOM.scroller.querySelectorAll('.room__img'));
	DOM.nav = {
		leftCtrl: DOM.content.querySelector('.btn--nav-left'),
		rightCtrl: DOM.content.querySelector('.btn--nav-right')
	};
	DOM.menuCtrl = DOM.content.querySelector('.btn--menu');
	DOM.menuOverlay = DOM.content.querySelector('.overlay--menu');
	DOM.infoCtrl = DOM.content.querySelector('.btn--info');
	DOM.infoOverlay = DOM.content.querySelector('.overlay--info');
	DOM.brand = DOM.content.querySelector('.codrops-header__title');
	DOM.subject = DOM.content.querySelector('.subject');
	DOM.location = DOM.content.querySelector('.location');
	DOM.auth = {
		panel: DOM.content.querySelector('.auth-panel'),
		loginCtrl: DOM.content.querySelector('[data-auth-action="login"]'),
		logoutCtrl: DOM.content.querySelector('[data-auth-action="logout"]'),
		user: DOM.content.querySelector('.auth-panel__user'),
		photo: DOM.content.querySelector('.auth-panel__photo'),
		name: DOM.content.querySelector('.auth-panel__name'),
		message: DOM.content.querySelector('.auth-panel__message')
	};
	DOM.viewer = {
		overlay: document.querySelector('.overlay--viewer'),
		image: document.querySelector('.viewer__img'),
		count: document.querySelector('.viewer__count'),
		closeCtrl: document.querySelector('.viewer__close'),
		prevCtrl: document.querySelector('.viewer__nav--prev'),
		nextCtrl: document.querySelector('.viewer__nav--next')
	};

	var currentRoom = 0;
	var totalRooms = DOM.rooms.length;
	var isAnimating = false;
	var touchStart = null;
	var viewerTouchStart = null;
	var currentViewerImage = 0;
	var profile = getProfile();
	var authInitialized = false;
	var chapters = [
		{title: 'Opening Roll', label: 'Photobook 01', note: 'A private reel by ' + profile.displayName},
		{title: 'Quiet Frames', label: 'Photobook 02', note: 'Personal moments without a feed'},
		{title: 'Archive Room', label: 'Photobook 03', note: 'Selected images, arranged like a screening'},
		{title: 'Night Contact', label: 'Photobook 04', note: 'Photos for people who have the link'},
		{title: 'After Credits', label: 'Photobook 05', note: 'A closing wall of saved scenes'}
	];

	function getProfile() {
		var reservedPaths = ['', 'index.html', '404.html'];
		var handle = window.location.pathname.split('/').filter(Boolean)[0] || 'velder';

		if (reservedPaths.indexOf(handle) !== -1) {
			handle = 'velder';
		}

		handle = decodeURIComponent(handle).replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 24) || 'velder';

		return {
			handle: handle,
			displayName: '@' + handle,
			shareUrl: window.location.origin + '/' + handle
		};
	}

	function setAppHeight() {
		document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
	}

	function getEventPoint(ev) {
		var touch = ev.changedTouches && ev.changedTouches.length ? ev.changedTouches[0] : ev;
		return {
			x: touch.clientX,
			y: touch.clientY
		};
	}

	function setCurrentRoom(index, direction) {
		if (isAnimating || index === currentRoom) {
			return;
		}

		isAnimating = true;
		var previousRoom = DOM.rooms[currentRoom];
		var previousSlide = DOM.slides[currentRoom];
		var nextRoom = DOM.rooms[index];
		var nextSlide = DOM.slides[index];
		var roomImages = nextRoom.querySelectorAll('.room__img');

		previousRoom.classList.remove('room--current');
		previousSlide.classList.remove('slide--current');
		nextRoom.classList.add('room--current');
		nextSlide.classList.add('slide--current');
		currentRoom = index;

		if (window.anime) {
			anime.remove([previousRoom, nextRoom, previousSlide, nextSlide, roomImages]);
			anime({
				targets: previousRoom,
				opacity: [1, 0],
				duration: 260,
				easing: 'easeOutQuad'
			});
			anime({
				targets: nextRoom,
				opacity: [0, 1],
				duration: 520,
				easing: 'easeOutQuad'
			});
			anime({
				targets: roomImages,
				opacity: [0, 1],
				translateY: [direction === 'next' ? 26 : -26, 0],
				delay: function(item, itemIndex) {
					return 70 * itemIndex;
				},
				duration: 620,
				easing: [0.2, 1, 0.3, 1],
				complete: function() {
					isAnimating = false;
				}
			});
			anime({
				targets: nextSlide,
				opacity: [0, 1],
				translateY: [16, 0],
				duration: 420,
				easing: 'easeOutQuad'
			});
		}
		else {
			isAnimating = false;
		}
	}

	function navigate(direction) {
		var nextIndex = direction === 'next'
			? (currentRoom + 1) % totalRooms
			: (currentRoom - 1 + totalRooms) % totalRooms;

		setCurrentRoom(nextIndex, direction);
	}

	function isViewerOpen() {
		return DOM.viewer.overlay && DOM.viewer.overlay.classList.contains('overlay--active');
	}

	function showViewerImage(index) {
		if (!DOM.viewer.image || !DOM.photoImages.length) {
			return;
		}

		currentViewerImage = (index + DOM.photoImages.length) % DOM.photoImages.length;
		var source = DOM.photoImages[currentViewerImage];
		DOM.viewer.image.src = source.currentSrc || source.src;
		DOM.viewer.image.alt = source.alt || 'Archive image';
		if (DOM.viewer.count) {
			DOM.viewer.count.textContent = (currentViewerImage + 1) + ' / ' + DOM.photoImages.length;
		}
	}

	function openViewer(index) {
		if (!DOM.viewer.overlay) {
			return;
		}

		closeMenu();
		closeInfo();
		showViewerImage(index);
		DOM.viewer.overlay.classList.add('overlay--active');
		DOM.viewer.overlay.setAttribute('aria-hidden', 'false');
		if (DOM.viewer.closeCtrl) {
			DOM.viewer.closeCtrl.focus();
		}
	}

	function closeViewer() {
		if (!DOM.viewer.overlay) {
			return;
		}

		DOM.viewer.overlay.classList.remove('overlay--active');
		DOM.viewer.overlay.setAttribute('aria-hidden', 'true');
		if (DOM.viewer.image) {
			DOM.viewer.image.removeAttribute('src');
		}
	}

	function navigateViewer(direction) {
		showViewerImage(currentViewerImage + (direction === 'next' ? 1 : -1));
	}

	function closeMenu() {
		DOM.menuCtrl.classList.remove('btn--active');
		DOM.menuOverlay.classList.remove('overlay--active');
	}

	function toggleMenu() {
		var isOpen = DOM.menuCtrl.classList.contains('btn--active');
		closeInfo();
		DOM.menuCtrl.classList.toggle('btn--active', !isOpen);
		DOM.menuOverlay.classList.toggle('overlay--active', !isOpen);
	}

	function ensureInfoContent() {
		if (DOM.infoOverlay.querySelector('.info')) {
			return;
		}

		DOM.infoOverlay.innerHTML = [
			'<div class="info">',
			'<h2>' + profile.displayName + '</h2>',
			'<p>A quiet web photobook for photos that do not need to interrupt everyone else.</p>',
			'<p class="info__link">' + profile.shareUrl + '</p>',
			'</div>'
		].join('');
	}

	function closeInfo() {
		DOM.infoCtrl.classList.remove('btn--active');
		DOM.infoOverlay.classList.remove('overlay--active');
	}

	function setAuthMessage(message) {
		if (DOM.auth.message) {
			DOM.auth.message.textContent = message || '';
		}
	}

	function setAuthLoading(isLoading) {
		if (DOM.auth.loginCtrl) {
			DOM.auth.loginCtrl.disabled = isLoading;
		}
		if (DOM.auth.logoutCtrl) {
			DOM.auth.logoutCtrl.disabled = isLoading;
		}
	}

	function getAuthErrorMessage(error) {
		var code = error && error.code;

		if (code === 'auth/popup-closed-by-user') {
			return '로그인이 취소되었습니다.';
		}
		if (code === 'auth/popup-blocked') {
			return '팝업이 차단되어 다시 연결합니다.';
		}
		if (code === 'auth/unauthorized-domain') {
			return 'Firebase Authentication 승인 도메인을 확인해 주세요.';
		}
		if (code === 'auth/operation-not-allowed') {
			return 'Firebase Console에서 Google 로그인 제공업체를 활성화해 주세요.';
		}

		return '로그인 처리 중 문제가 발생했습니다.';
	}

	function renderAuthState(user) {
		var isSignedIn = !!user;

		if (!DOM.auth.panel) {
			return;
		}

		DOM.auth.panel.classList.toggle('auth-panel--signed-in', isSignedIn);
		if (DOM.auth.loginCtrl) {
			DOM.auth.loginCtrl.hidden = isSignedIn;
		}
		if (DOM.auth.user) {
			DOM.auth.user.hidden = !isSignedIn;
		}
		if (DOM.auth.name) {
			DOM.auth.name.textContent = isSignedIn ? (user.displayName || user.email || 'Google user') : '';
		}
		if (DOM.auth.photo) {
			DOM.auth.photo.hidden = !isSignedIn || !user.photoURL;
			DOM.auth.photo.src = isSignedIn && user.photoURL ? user.photoURL : '';
		}

		setAuthMessage(isSignedIn ? '로그인됨' : '');
	}

	function signInWithGoogle() {
		if (!window.firebase || !firebase.auth) {
			setAuthMessage('Firebase Auth를 불러오지 못했습니다.');
			return;
		}

		var provider = new firebase.auth.GoogleAuthProvider();
		provider.setCustomParameters({
			prompt: 'select_account'
		});

		setAuthLoading(true);
		setAuthMessage('Google 계정으로 연결 중...');
		firebase.auth().signInWithPopup(provider)
			.catch(function(error) {
				if (error && error.code === 'auth/popup-blocked') {
					setAuthMessage(getAuthErrorMessage(error));
					return firebase.auth().signInWithRedirect(provider);
				}

				setAuthMessage(getAuthErrorMessage(error));
				console.error(error);
			})
			.finally(function() {
				setAuthLoading(false);
			});
	}

	function signOutFromGoogle() {
		if (!window.firebase || !firebase.auth) {
			return;
		}

		setAuthLoading(true);
		firebase.auth().signOut()
			.catch(function(error) {
				setAuthMessage('로그아웃 처리 중 문제가 발생했습니다.');
				console.error(error);
			})
			.finally(function() {
				setAuthLoading(false);
			});
	}

	function initAuth() {
		if (authInitialized || !DOM.auth.panel || !window.firebase || !firebase.auth) {
			return;
		}

		authInitialized = true;
		firebase.auth().getRedirectResult().catch(function(error) {
			setAuthMessage(getAuthErrorMessage(error));
			console.error(error);
		});
		firebase.auth().onAuthStateChanged(renderAuthState, function(error) {
			setAuthMessage(getAuthErrorMessage(error));
			console.error(error);
		});

		if (DOM.auth.loginCtrl) {
			DOM.auth.loginCtrl.addEventListener('click', signInWithGoogle);
		}
		if (DOM.auth.logoutCtrl) {
			DOM.auth.logoutCtrl.addEventListener('click', signOutFromGoogle);
		}
	}

	function toggleInfo() {
		var isOpen = DOM.infoCtrl.classList.contains('btn--active');
		closeMenu();
		ensureInfoContent();
		DOM.infoCtrl.classList.toggle('btn--active', !isOpen);
		DOM.infoOverlay.classList.toggle('overlay--active', !isOpen);
	}

	function onTouchStart(ev) {
		if (isViewerOpen()) {
			return;
		}
		if (DOM.menuCtrl.classList.contains('btn--active') || DOM.infoCtrl.classList.contains('btn--active')) {
			return;
		}

		touchStart = getEventPoint(ev);
	}

	function onTouchEnd(ev) {
		if (!touchStart) {
			return;
		}

		var touchEnd = getEventPoint(ev);
		var diffX = touchEnd.x - touchStart.x;
		var diffY = touchEnd.y - touchStart.y;
		var minSwipe = Math.min(100, Math.max(44, window.innerWidth * 0.15));
		touchStart = null;

		if (Math.abs(diffX) > minSwipe && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
			navigate(diffX < 0 ? 'next' : 'prev');
		}
	}

	function onViewerTouchStart(ev) {
		viewerTouchStart = getEventPoint(ev);
	}

	function onViewerTouchEnd(ev) {
		if (!viewerTouchStart) {
			return;
		}

		var touchEnd = getEventPoint(ev);
		var diffX = touchEnd.x - viewerTouchStart.x;
		var diffY = touchEnd.y - viewerTouchStart.y;
		viewerTouchStart = null;

		if (Math.abs(diffX) > 44 && Math.abs(diffX) > Math.abs(diffY) * 1.25) {
			navigateViewer(diffX < 0 ? 'next' : 'prev');
		}
	}

	function initEvents() {
		DOM.nav.leftCtrl.addEventListener('click', function() {
			navigate('prev');
		});
		DOM.nav.rightCtrl.addEventListener('click', function() {
			navigate('next');
		});
		DOM.menuCtrl.addEventListener('click', toggleMenu);
		DOM.infoCtrl.addEventListener('click', toggleInfo);
		DOM.photoImages.forEach(function(image, index) {
			image.setAttribute('tabindex', '0');
			image.setAttribute('role', 'button');
			image.addEventListener('click', function() {
				openViewer(index);
			});
			image.addEventListener('keydown', function(ev) {
				if (ev.key === 'Enter' || ev.key === ' ') {
					ev.preventDefault();
					openViewer(index);
				}
			});
		});
		if (DOM.viewer.closeCtrl) {
			DOM.viewer.closeCtrl.addEventListener('click', closeViewer);
		}
		if (DOM.viewer.prevCtrl) {
			DOM.viewer.prevCtrl.addEventListener('click', function() {
				navigateViewer('prev');
			});
		}
		if (DOM.viewer.nextCtrl) {
			DOM.viewer.nextCtrl.addEventListener('click', function() {
				navigateViewer('next');
			});
		}
		if (DOM.viewer.overlay) {
			DOM.viewer.overlay.addEventListener('click', function(ev) {
				if (ev.target === DOM.viewer.overlay) {
					closeViewer();
				}
			});
			DOM.viewer.overlay.addEventListener('touchstart', onViewerTouchStart, {passive: true});
			DOM.viewer.overlay.addEventListener('touchend', onViewerTouchEnd, {passive: true});
		}
		document.addEventListener('touchstart', onTouchStart, {passive: true});
		document.addEventListener('touchend', onTouchEnd, {passive: true});
		document.addEventListener('firebase-ready', initAuth);
		window.addEventListener('resize', setAppHeight);
		window.addEventListener('orientationchange', setAppHeight);
		window.addEventListener('keydown', function(ev) {
			if (isViewerOpen()) {
				if (ev.key === 'ArrowRight') {
					navigateViewer('next');
				}
				if (ev.key === 'ArrowLeft') {
					navigateViewer('prev');
				}
				if (ev.key === 'Escape') {
					closeViewer();
				}
				return;
			}
			if (ev.key === 'ArrowRight') {
				navigate('next');
			}
			if (ev.key === 'ArrowLeft') {
				navigate('prev');
			}
			if (ev.key === 'Escape') {
				closeMenu();
				closeInfo();
			}
		});
	}

	function init() {
		setAppHeight();
		document.title = profile.displayName + ' / VELDER ARCHIVE';
		DOM.brand.textContent = profile.displayName;
		DOM.subject.textContent = 'PRIVATE WEB PHOTOBOOK';
		DOM.location.textContent = profile.shareUrl.replace(/^https?:\/\//, '');
		DOM.rooms.forEach(function(room, index) {
			room.classList.toggle('room--current', index === currentRoom);
			room.style.opacity = index === currentRoom ? 1 : 0;
			room.setAttribute('aria-label', chapters[index].title);
		});
		DOM.slides.forEach(function(slide, index) {
			var title = slide.querySelector('.slide__title span');
			var number = slide.querySelector('.slide__number');
			var date = slide.querySelector('.slide__date');

			if (title) {
				title.textContent = chapters[index].title;
			}
			if (number) {
				number.innerHTML = chapters[index].label + ' <strong>' + profile.displayName + '</strong>';
			}
			if (date) {
				date.textContent = chapters[index].note;
			}
			slide.classList.toggle('slide--current', index === currentRoom);
		});
		initEvents();
		initAuth();
	}

	imagesLoaded(DOM.scroller, function() {
		init();
		if (window.anime) {
			anime({
				targets: DOM.loader,
				duration: 450,
				easing: 'easeInOutCubic',
				delay: 350,
				opacity: [1, 0],
				complete: function() {
					DOM.loader.classList.remove('overlay--active');
				}
			});
		}
		else {
			DOM.loader.classList.remove('overlay--active');
		}
	});

})(window);
