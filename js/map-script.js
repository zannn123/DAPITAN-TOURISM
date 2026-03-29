/* ========================================
   MAP PAGE SCRIPT — map-script.js
   Handles: view toggle, legend filter, tooltip
   ======================================== */

(() => {
    const tabSvg = document.getElementById('tabSvg');
    const tabGmap = document.getElementById('tabGmap');
    const svgView = document.getElementById('svgView');
    const gmapView = document.getElementById('gmapView');
    const legendRow = document.getElementById('legendRow');
    const tip = document.getElementById('mapTip');
    const tipBox = document.getElementById('tipBox');
    const tipCat = document.getElementById('tipCat');
    const tipName = document.getElementById('tipName');
    const tipDesc = document.getElementById('tipDesc');
    const tipBtn = document.getElementById('tipBtn');
    const legendPills = document.querySelectorAll('.legend-pill');
    const poiElements = document.querySelectorAll('.poi');

    if (!tabSvg || !tabGmap || !svgView || !gmapView || !legendRow || !tip || !tipBox || !tipCat || !tipName || !tipDesc || !tipBtn) {
        return;
    }

    let hideT;

    tabSvg.onclick = () => {
        svgView.style.display = 'block';
        gmapView.style.display = 'none';
        legendRow.style.display = 'flex';
        tabSvg.classList.add('active');
        tabGmap.classList.remove('active');
    };

    tabGmap.onclick = () => {
        svgView.style.display = 'none';
        gmapView.style.display = 'block';
        legendRow.style.display = 'none';
        tabGmap.classList.add('active');
        tabSvg.classList.remove('active');
    };

    legendPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const category = pill.dataset.cat;
            const anyInactive = [...legendPills].some(item => item.classList.contains('inactive'));
            const isInactive = pill.classList.contains('inactive');

            if (!anyInactive || isInactive) {
                legendPills.forEach(item => item.classList.toggle('inactive', item.dataset.cat !== category));
                filterPOIs(category);
                return;
            }

            legendPills.forEach(item => item.classList.remove('inactive'));
            filterPOIs('all');
        });
    });

    function filterPOIs(category) {
        poiElements.forEach(poi => {
            const match = category === 'all' || poi.dataset.cat === category;
            poi.style.opacity = match ? '1' : '0.18';
            poi.style.pointerEvents = match ? 'auto' : 'none';
        });
    }

    function showTip(element, event) {
        clearTimeout(hideT);
        tipCat.textContent = element.dataset.catLabel || element.dataset.cat;
        tipName.textContent = element.dataset.name;
        tipDesc.innerHTML = element.dataset.desc;
        tipBtn.href = element.dataset.link || 'index.html#explore';
        tipBox.style.setProperty('--tc', element.dataset.color);
        tip.style.setProperty('--tc', element.dataset.color);
        posTip(event);
        tip.classList.add('show');
    }

    function posTip(event) {
        const margin = 14;
        const tipWidth = tip.offsetWidth || 270;
        const tipHeight = tip.offsetHeight || 160;
        let x = event.clientX + margin;
        let y = event.clientY - tipHeight / 2;

        if (x + tipWidth > window.innerWidth - 10) {
            x = event.clientX - tipWidth - margin;
        }
        if (y < 10) {
            y = 10;
        }
        if (y + tipHeight > window.innerHeight - 10) {
            y = window.innerHeight - tipHeight - 10;
        }

        tip.style.left = `${x}px`;
        tip.style.top = `${y}px`;
    }

    function hideTip() {
        hideT = setTimeout(() => tip.classList.remove('show'), 180);
    }

    poiElements.forEach(element => {
        element.addEventListener('mouseenter', event => showTip(element, event));
        element.addEventListener('mousemove', event => posTip(event));
        element.addEventListener('mouseleave', hideTip);
        element.addEventListener('click', () => {
            window.location.href = element.dataset.link || 'index.html#explore';
        });
        element.addEventListener('touchstart', event => {
            event.preventDefault();
            const touch = event.touches[0];
            showTip(element, { clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });
    });

    tip.addEventListener('mouseenter', () => clearTimeout(hideT));
    tip.addEventListener('mouseleave', hideTip);
})();
