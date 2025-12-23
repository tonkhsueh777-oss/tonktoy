<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎬 Sora 2 Pro 宇宙導演版 (主演：我@tonkhsueh)</title>
    <style>
        /* --- CSS 樣式保持不變 (包含手機優化) --- */
        :root {
            --bg-dark: #0a0a0c;
            --panel-dark: #141419;
            --text-light: #e0e0e0;
            --accent-gold: #FFD700;
            --accent-green: #00E676;
            --accent-cyan: #00B0FF;
            --accent-purple: #D500F9;
            --accent-red: #FF3D00;
            --border: #2a2a35;
        }
        body {
            font-family: '微軟正黑體', 'SF Pro TC', Roboto, sans-serif;
            background-color: var(--bg-dark);
            color: var(--text-light);
            margin: 0;
            padding: 30px;
            line-height: 1.5;
            overflow-x: hidden;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: var(--panel-dark);
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 25px 60px rgba(0,0,0,0.6);
            border: 1px solid var(--border);
        }
        h1 {
            text-align: center;
            background: linear-gradient(90deg, var(--accent-gold), var(--accent-purple), var(--accent-cyan));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
            font-size: 2.5rem;
            font-weight: 800;
        }
        .user-badge {
            text-align: center; display: block; margin: 0 auto 2rem auto;
            background: linear-gradient(90deg, #333, #444); color: var(--accent-cyan); padding: 8px 20px;
            border-radius: 30px; font-size: 1rem; width: fit-content;
            border: 2px solid var(--accent-cyan); font-weight: bold;
            box-shadow: 0 0 15px rgba(0, 176, 255, 0.3);
        }

        .section-title {
            font-size: 1.2rem;
            font-weight: 700;
            margin-top: 45px;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .story-select {
            width: 100%;
            padding: 16px;
            background: #1f1f26;
            border: 2px solid var(--accent-gold);
            border-radius: 10px;
            color: white;
            font-size: 16px;
            cursor: pointer;
            outline: none;
            margin-bottom: 15px;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 15px center;
            background-size: 20px;
        }
        .story-select optgroup { color: var(--accent-gold); font-weight: bold; background: #141419; }
        .story-select option { background: #1f1f26; color: white; padding: 10px; }
        
        .btn-random {
            background: transparent;
            color: var(--accent-gold);
            border: 2px solid var(--accent-gold);
            padding: 8px 20px;
            border-radius: 30px;
            font-size: 0.95rem;
            cursor: pointer;
            font-weight: bold;
            transition: 0.3s;
        }
        .btn-random:hover { background: var(--accent-gold); color: black; box-shadow: 0 0 15px rgba(255, 215, 0, 0.3); }

        .story-preview {
            background: rgba(255, 215, 0, 0.08);
            border-left: 4px solid var(--accent-gold);
            padding: 15px;
            font-size: 1rem;
            color: #eee;
            margin-bottom: 25px;
            font-style: italic;
            border-radius: 0 10px 10px 0;
            transition: background-color 0.3s ease;
        }

        .options-grid-directors { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
        .options-grid-checkboxes { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }

        .radio-label, .checkbox-label {
            display: block; background: #1f1f26; padding: 12px; border-radius: 8px; cursor: pointer;
            border: 2px solid transparent; font-size: 13px; transition: 0.2s; position: relative; overflow: hidden; word-break: break-word;
            display: flex; align-items: center;
        }
        .radio-label:hover, .checkbox-label:hover { background: #2a2a35; }
        input { margin-right: 8px; accent-color: white; flex-shrink: 0; }

        .dir-opt input:checked + span { color: var(--accent-green); font-weight: bold; }
        .dir-opt:has(input:checked) { border-color: var(--accent-green); background: rgba(0, 230, 118, 0.1); }
        .cam-opt input:checked + span { color: var(--accent-cyan); font-weight: bold; }
        .cam-opt:has(input:checked) { border-color: var(--accent-cyan); }
        .vfx-opt input:checked + span { color: var(--accent-purple); font-weight: bold; }
        .vfx-opt:has(input:checked) { border-color: var(--accent-purple); }
        .twist-opt input:checked + span { color: var(--accent-red); font-weight: bold; }
        .twist-opt:has(input:checked) { border-color: var(--accent-red); background: rgba(255, 61, 0, 0.1); }

        .btn-generate {
            margin-top: 50px; width: 100%; padding: 20px; background: linear-gradient(45deg, var(--accent-purple), var(--accent-cyan));
            color: white; border: none; border-radius: 12px; font-size: 1.3rem; font-weight: 800; cursor: pointer; transition: 0.3s;
            box-shadow: 0 10px 30px rgba(0, 176, 255, 0.3); letter-spacing: 2px;
        }
        .btn-generate:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(213, 0, 249, 0.5); }

        .result-section { margin-top: 40px; display: none; animation: slideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        .prompt-box { background: #000; padding: 25px; border-radius: 12px; border: 2px solid #333; position: relative; margin-bottom: 25px; }
        .box-label { font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 1px; font-weight: bold; display: flex; align-items: center; gap: 5px;}
        .prompt-content { font-family: 'JetBrains Mono', 'Courier New', monospace; color: #e0e0e0; line-height: 1.7; white-space: pre-wrap; font-size: 15px; }
        
        .copy-btn {
            position: absolute; top: 20px; right: 20px; background: #333; border: 1px solid #555; padding: 6px 15px;
            border-radius: 6px; color: white; cursor: pointer; font-size: 12px; font-weight: bold; transition: 0.2s;
        }
        .copy-btn:hover { background: white; color: black; border-color: white; }

        @media (max-width: 768px) {
            body { padding: 15px; }
            .container { padding: 1.5rem; border-radius: 15px; }
            h1 { font-size: 1.8rem; }
            .section-title { font-size: 1.1rem; margin-top: 30px; flex-direction: column; align-items: flex-start; gap: 10px; }
            .btn-random { width: 100%; text-align: center; padding: 10px; }
            .story-select { font-size: 14px; padding: 12px; }
            .options-grid-directors, .options-grid-checkboxes { grid-template-columns: 1fr 1fr; gap: 8px; }
            .radio-label, .checkbox-label { padding: 10px 8px; }
            .btn-generate { font-size: 1.1rem; padding: 15px; margin-top: 30px; }
            .copy-btn { top: 10px; right: 10px; padding: 4px 10px; font-size: 11px; }
        }
        @media (max-width: 480px) { .options-grid-directors { grid-template-columns: 1fr; } h1 { font-size: 1.5rem; } }
    </style>
</head>
<body>

<div class="container">
    <h1>🎬 Sora 2 Pro 宇宙導演版</h1>
    <span class="user-badge">👤 專屬主演：我 (@tonkhsueh)</span>
    
    <div class="section-title" style="border-color: var(--accent-gold);">
        <span style="color: var(--accent-gold);">1. 選擇你經歷的場景 (Script Database)</span>
        <button class="btn-random" onclick="randomScript()">🎲 隨機抽取劇本</button>
    </div>
    
    <select id="storySelect" class="story-select" onchange="updatePreview()">
        <optgroup label="🤖 硬核科幻 (Hard Sci-Fi)">
            <option value="s01">重型機甲都市巷戰</option>
            <option value="s02">太空電梯墜落事故</option>
            <option value="s03">賽博龐克駭客入侵</option>
            <option value="s04">月球基地採礦意外</option>
            <option value="s05">巨大與外星生物接觸</option>
            <option value="s06">戴森球建造現場縮時</option>
            <option value="s07">反物質引擎啟動測試</option>
            <option value="s08">失控的人工智慧伺服器機房</option>
            <option value="s09">木衛二冰層下的水下城市</option>
            <option value="s10">太空垃圾回收船作業</option>
            <option value="s11">時間旅行實驗失敗瞬間</option>
            <option value="s12">腦機介面駭入視覺</option>
            <option value="s13">基因工程實驗室的培育槽</option>
            <option value="s14">火星地球化改造工程</option>
            <option value="s15">小行星帶採礦雷射切割</option>
        </optgroup>
        <optgroup label="⚔️ 史詩奇幻 (Epic Fantasy)">
            <option value="f01">巨龍噴火燒毀城堡</option>
            <option value="f02">巫師施展大型冰系魔法</option>
            <option value="f03">古代兩軍交鋒戰場</option>
            <option value="f04">召喚巨大的岩石巨人</option>
            <option value="f05">騎乘獅鷲獸穿越雲層</option>
            <option value="f06">死靈法師復活亡靈大軍</option>
            <option value="f07">浮空島嶼之間的空戰</option>
            <option value="f08">夜間發光的魔法森林</option>
            <option value="f09">火山內部的矮人鍛造廠</option>
            <option value="f10">精靈弓箭手防守巨樹</option>
            <option value="f11">深海巨妖攻擊木造帆船</option>
            <option value="f12">競技場內的魔法決鬥</option>
            <option value="f13">探險家發現古代遺跡</option>
            <option value="f14">神秘傳送門開啟瞬間</option>
            <option value="f15">召喚來自地獄的惡魔</option>
        </optgroup>
        <optgroup label="🎭 無版權角色致敬 (Safe Cosplay)">
            <option value="c01">騎掃把的戴眼鏡少年法師</option>
            <option value="c02">紅金配色的高科技動力裝甲</option>
            <option value="c03">綠髮紫西裝的瘋狂小丑</option>
            <option value="c04">揮舞紅色光劍的黑武士</option>
            <option value="c05">召喚冰雪的藍裙女王</option>
        </optgroup>
        <optgroup label="🐪 荒誕與超現實 (Surreal & Absurd)">
            <option value="a01">駱駝在商務電梯裡吃草</option>
            <option value="a02">雲海中游泳的座頭鯨</option>
            <option value="a03">融化的時鐘沙漠</option>
            <option value="a04">巨大貓咪把火車當玩具</option>
            <option value="a05">下雨天落下的是魚</option>
            <option value="a06">人們的頭部變成了電視機</option>
            <option value="a07">房間內的地心引力隨意切換</option>
            <option value="a08">通往天空深處的無限樓梯</option>
            <option value="a09">一個完全由書本組成的人</option>
            <option value="a10">河流中漂浮著巨大的黃色橡皮鴨</option>
            <option value="a11">天空下起了眼球雨</option>
            <option value="a12">影子擁有自己的生命並脫離本體</option>
            <option value="a13">一個所有東西都是毛皮製成的房間</option>
            <option value="a14">會說話的家具正在開會</option>
            <option value="a15">魚在空氣中游泳，鳥在水裡飛</option>
        </optgroup>
        <optgroup label="🌿 自然奇觀 (Nature Awe)">
            <option value="n01">穿越正在噴發的火山口</option>
            <option value="n02">發光生物的阿凡達森林</option>
            <option value="n03">極地冰川崩解瞬間</option>
            <option value="n04">深海巨型烏賊捕食</option>
            <option value="n05">超級風暴閃電慢動作</option>
            <option value="n06">山脈上空的極光大爆發</option>
            <option value="n07">百萬隻角馬大遷徙過河</option>
            <option value="n08">花朵綻放的超高速縮時攝影</option>
            <option value="n09">微距鏡頭下的昆蟲世界</option>
            <option value="n10">潛水員探索水下洞穴</option>
            <option value="n11">撒哈拉沙漠的巨大沙塵暴</option>
            <option value="n12">閃電擊中海面的瞬間</option>
            <option value="n13">充滿迷霧的巨型紅杉林</option>
            <option value="n14">數萬隻椋鳥的群飛舞蹈</option>
            <option value="n15">火山爆發產生的火山閃電</option>
        </optgroup>
        <optgroup label="🏙️ 電影感日常 (Cinematic Life)">
            <option value="l01">東京雨夜霓虹街頭</option>
            <option value="l02">米其林大廚火焰烹飪</option>
            <option value="l03">復古敞篷車夕陽公路之旅</option>
            <option value="l04">繁忙的紐約時代廣場縮時</option>
            <option value="l05">職人手工鍛造武士刀</option>
            <option value="l06">雨天溫暖的咖啡館內部</option>
            <option value="l07">街頭藝人在廣場表演</option>
            <option value="l08">夜晚的地鐵列車經過</option>
            <option value="l09">繁忙的東京築地魚市場</option>
            <option value="l10">陶藝家製作陶器的過程</option>
            <option value="l11">情侶在城市屋頂跳舞</option>
            <option value="l12">充滿灰塵的古老圖書館</option>
            <option value="l13">繁忙的國際機場航廈</option>
            <option value="l14">蜿蜒山路的空拍鏡頭</option>
            <option value="l15">盛大的夏季煙火大會</option>
        </optgroup>
        <optgroup label="👻 驚悚懸疑 (Thriller & Horror)">
            <option value="t01">第一人稱喪屍追逐</option>
            <option value="t02">鏡子裡不同步的倒影</option>
            <option value="t03">廢棄精神病院手持探險</option>
            <option value="t04">迷霧中出現巨大觸手</option>
            <option value="t05">監視器畫面中的靈異現象</option>
            <option value="t06">深夜公園的跟蹤者視角</option>
            <option value="t07">恐怖的人偶自己移動</option>
            <option value="t08">一隻手從床底下伸出</option>
            <option value="t09">下水道裡的詭異小丑</option>
            <option value="t10">鬧鬼的維多利亞式老宅外觀</option>
            <option value="t11">夜晚充滿迷霧的詭異森林</option>
            <option value="t12">監視器拍到入侵者</option>
            <option value="t13">恐慌室內的緊急封鎖</option>
            <option value="t14">深夜的高速公路飛車追逐</option>
            <option value="t15">詭異的邪教儀式現場</option>
        </optgroup>
        <optgroup label="🎞️ 復古與藝術 (Retro & Art)">
            <option value="r01">80年代錄影帶故障風廣告</option>
            <option value="r02">黑白黑色電影偵探片</option>
            <option value="r03">蒸汽龐克飛船城市</option>
            <option value="r04">印象派油畫風格的田園</option>
            <option value="r05">定格黏土動畫怪物</option>
            <option value="r06">20年代默片風格</option>
            <option value="r07">像素藝術遊戲風格動畫</option>
            <option value="r08">蒸氣波美學的城市景觀</option>
            <option value="r09">文藝復興時期繪畫風格</option>
            <option value="r10">50年代科幻B級片質感</option>
            <option value="r11">抽象幾何圖形的動態藝術</option>
            <option value="r12">水彩風景畫動畫</option>
            <option value="r13">炭筆素描風格動畫</option>
            <option value="r14">野獸派建築導覽</option>
            <option value="r15">迷幻的60年代旅程</option>
        </optgroup>
        <optgroup label="🏛️ 歷史重現 (Historical)">
            <option value="h01">羅馬軍團行軍</option>
            <option value="h02">建造金字塔的場景</option>
            <option value="h03">維京長船航行</option>
            <option value="h04">櫻花樹下的武士決鬥</option>
            <option value="h05">二戰空中纏鬥</option>
            <option value="h06">古希臘議會辯論</option>
            <option value="h07">西部牛仔正午決鬥</option>
            <option value="h08">中世紀騎士長槍比武</option>
            <option value="h09">工業革命時期的工廠內部</option>
            <option value="h10">鐵達尼號啟航出港</option>
            <option value="h11">秦始皇陵兵馬俑復活</option>
            <option value="h12">美國獨立戰爭戰場</option>
            <option value="h13">文藝復興時期威尼斯嘉年華</option>
            <option value="h14">古代瑪雅城市的祭典</option>
            <option value="h15">冷戰時期柏林圍牆檢查哨</option>
        </optgroup>
        <optgroup label="🏂 運動與極限 (Sports & Extreme)">
            <option value="x01">飛鼠裝滑翔穿越山谷</option>
            <option value="x02">巨浪衝浪者</option>
            <option value="x03">F1賽車進站換胎</option>
            <option value="x04">城市屋頂跑酷</option>
            <option value="x05">徒手攀岩險峻懸崖</option>
            <option value="x06">電影感的籃球灌籃</option>
            <option value="x07">下坡山地自行車賽</option>
            <option value="x08">深海自由潛水</option>
            <option value="x09">滑板慢動作特技</option>
            <option value="x10">單板滑雪粉雪衝刺</option>
            <option value="x11">摩托車越野飛躍</option>
            <option value="x12">高空跳傘自由落體</option>
            <option value="x13">冰上曲棍球激烈碰撞</option>
            <option value="x14">拳擊賽最後一回合擊倒</option>
            <option value="x15">極限BMX單車特技</option>
        </optgroup>
    </select>

    <div id="storyPreview" class="story-preview">
        預覽載入中...
    </div>

    <div class="section-title" style="border-color: var(--accent-green);">
        <span style="color: var(--accent-green);">2. 大師導演濾鏡 (Director's Cut)</span>
    </div>
    <div class="options-grid-directors">
        <label class="radio-label dir-opt"><input type="radio" name="director" value="nolan" checked> <span>📽️ 諾蘭 (Nolan)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="lucas"> <span>🚀 盧卡斯 (Lucas)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="wes"> <span>🎨 魏斯安德森 (Wes)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="wong"> <span>🍷 王家衛 (Wong)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="bay"> <span>💥 麥可貝 (Bay)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="burton"> <span>🦇 提姆波頓 (Burton)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="miyazaki"> <span>☁️ 宮崎駿 (Miyazaki)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="villeneuve"> <span>🟧 維勒納夫 (Villeneuve)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="hitchcock"> <span>🔪 希區考克 (Hitchcock)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="lynch"> <span>🧠 大衛林區 (Lynch)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="kubrick"> <span>👁️ 庫柏力克 (Kubrick)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="deltoro"> <span>🧚 戴爾托羅 (Del Toro)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="tarantino"> <span>🔫 昆丁 (Tarantino)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="kitano"> <span>💙 北野武 (Kitano)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="kurosawa"> <span>⚔️ 黑澤明 (Kurosawa)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="anime_cyber"> <span>🤖 賽博動畫 (Cyber Anime)</span></label>
        <label class="radio-label dir-opt"><input type="radio" name="director" value="noir_comic"> <span>🎞️ 黑色漫畫 (Noir Comic)</span></label>
    </div>

    <div class="section-title" style="border-color: var(--accent-cyan);">
        <span style="color: var(--accent-cyan);">3. 攝影機運鏡 (Camera Movement)</span>
    </div>
    <div class="options-grid-checkboxes">
        <label class="checkbox-label cam-opt"><input type="checkbox" name="camera" value="無人機廣角航拍"> <span>🚁 無人機航拍</span></label>
        <label class="checkbox-label cam-opt"><input type="checkbox" name="camera" value="低角度仰拍(Low Angle)"> <span>📐 低角度仰拍</span></label>
        <label class="checkbox-label cam-opt"><input type="checkbox" name="camera" value="極致特寫(Extreme Close-up)"> <span>👀 極致特寫</span></label>
        <label class="checkbox-label cam-opt"><input type="checkbox" name="camera" value="動態跟隨(Tracking Shot)"> <span>🏃 動態跟隨</span></label>
        <label class="checkbox-label cam-opt"><input type="checkbox" name="camera" value="第一人稱主觀視角(POV)"> <span>🕶️ 第一人稱主觀視角(POV)</span></label>
        <label class="checkbox-label cam-opt"><input type="checkbox" name="camera" value="希區考克式變焦(Dolly Zoom)"> <span>😵 希區考克變焦</span></label>
        <label class="checkbox-label cam-opt"><input type="checkbox" name="camera" value="手持攝影晃動感(Handheld)"> <span>👋 手持晃動感</span></label>
        <label class="checkbox-label cam-opt"><input type="checkbox" name="camera" value="環繞子彈時間(Bullet Time Orbit)"> <span>🔄 環繞子彈時間</span></label>
        <label class="checkbox-label cam-opt"><input type="checkbox" name="camera" value="急速推鏡(Crash Zoom)"> <span>💨 急速推鏡</span></label>
        <label class="checkbox-label cam-opt"><input type="checkbox" name="camera" value="身前固定主觀鏡頭(SnorriCam)"> <span>📹 SnorriCam固定視角</span></label>
        <label class="checkbox-label cam-opt"><input type="checkbox" name="camera" value="荷蘭式傾斜構圖(Dutch Angle)"> <span>📐 荷蘭式傾斜</span></label>
        <label class="checkbox-label cam-opt"><input type="checkbox" name="camera" value="長鏡頭一鏡到底(Long Take One Shot)"> <span>🎬 長鏡頭一鏡到底</span></label>
    </div>

    <div class="section-title" style="border-color: var(--accent-purple);">
        <span style="color: var(--accent-purple);">4. 視覺特效 (Visual FX)</span>
    </div>
    <div class="options-grid-checkboxes">
        <label class="checkbox-label vfx-opt"><input type="checkbox" name="vfx" value="電影級慢動作(Slow Motion)"> <span>🐌 電影慢動作</span></label>
        <label class="checkbox-label vfx-opt"><input type="checkbox" name="vfx" value="景深虛化(Bokeh)"> <span>📷 景深虛化</span></label>
        <label class="checkbox-label vfx-opt"><input type="checkbox" name="vfx" value="膠片顆粒感(Film Grain)"> <span>🎞️ 膠片顆粒感</span></label>
        <label class="checkbox-label vfx-opt"><input type="checkbox" name="vfx" value="賽博龐克故障風(Glitch Art)"> <span>📺 數位故障風</span></label>
        <label class="checkbox-label vfx-opt"><input type="checkbox" name="vfx" value="丁達爾耶穌光(God Rays)"> <span>✨ 丁達爾光束</span></label>
        <label class="checkbox-label vfx-opt"><input type="checkbox" name="vfx" value="色散故障效果(Chromatic Aberration)"> <span>🌈 色散故障效果</span></label>
        <label class="checkbox-label vfx-opt"><input type="checkbox" name="vfx" value="熱成像視覺(Thermal Vision)"> <span>🔥 熱成像視覺</span></label>
        <label class="checkbox-label vfx-opt"><input type="checkbox" name="vfx" value="夜視儀綠色畫面(Night Vision)"> <span>💚 夜視儀畫面</span></label>
        <label class="checkbox-label vfx-opt"><input type="checkbox" name="vfx" value="藝術雙重曝光(Double Exposure)"> <span>👥 藝術雙重曝光</span></label>
        <label class="checkbox-label vfx-opt"><input type="checkbox" name="vfx" value="環境粒子飄散(Particle Effects)"> <span>✨ 環境粒子飄散</span></label>
        <label class="checkbox-label vfx-opt"><input type="checkbox" name="vfx" value="移軸微縮模型效果(Tilt-shift)"> <span>🏙️ 移軸微縮模型效果</span></label>
    </div>

    <div class="section-title" style="border-color: var(--accent-red);">
        <span style="color: var(--accent-red);">5. 超現實轉折 (The Twist)</span>
    </div>
    <div class="options-grid-checkboxes">
        <label class="checkbox-label twist-opt"><input type="checkbox" name="twist" value="物體化為沙塵消散"> <span>⏳ 化為沙塵</span></label>
        <label class="checkbox-label twist-opt"><input type="checkbox" name="twist" value="融化成液體"> <span>💧 融化成液體</span></label>
        <label class="checkbox-label twist-opt"><input type="checkbox" name="twist" value="機械化變身"> <span>🤖 機械化變身</span></label>
        <label class="checkbox-label twist-opt"><input type="checkbox" name="twist" value="地心引力突然反轉"> <span>⬆️ 引力反轉</span></label>
        <label class="checkbox-label twist-opt"><input type="checkbox" name="twist" value="世界崩塌如《全面啟動》"> <span>🏙️ 世界崩塌</span></label>
        <label class="checkbox-label twist-opt"><input type="checkbox" name="twist" value="鏡頭拉遠發現是玩具模型"> <span>🧸 發現是玩具</span></label>
        <label class="checkbox-label twist-opt"><input type="checkbox" name="twist" value="主角打破第四面牆看向鏡頭"> <span>👀 打破第四面牆</span></label>
        <label class="checkbox-label twist-opt"><input type="checkbox" name="twist" value="時間突然循環重置"> <span>🔄 時間循環重置</span></label>
        <label class="checkbox-label twist-opt"><input type="checkbox" name="twist" value="現實故障變成3D線框模式"> <span>🌐 變成線框模式</span></label>
        <label class="checkbox-label twist-opt"><input type="checkbox" name="twist" value="周圍物體突然擬人化"> <span>🪑 物體擬人化</span></label>
        <label class="checkbox-label twist-opt"><input type="checkbox" name="twist" value="畫風突變為手繪動畫"> <span>🎨 突變為手繪動畫</span></label>
    </div>

    <button class="btn-generate" onclick="generate()">🚀 啟動引擎，生成我主演的 Prompt</button>

    <div class="result-section" id="resultSection">
        <div class="prompt-box" style="border-color: var(--accent-purple);">
            <div class="box-label"><span style="color: var(--accent-purple);">■</span> Master Prompt (統合指令 - 主演：我)</div>
            <button class="copy-btn" onclick="copyResult('masterPrompt')">複製</button>
            <div class="prompt-content" id="masterPrompt"></div>
        </div>
        <div class="prompt-box" style="border-color: var(--accent-cyan);">
            <div class="box-label"><span style="color: var(--accent-cyan);">■</span> Timeline Script (分鏡腳本)</div>
            <button class="copy-btn" onclick="copyResult('timelinePrompt')">複製</button>
            <div class="prompt-content" id="timelinePrompt"></div>
        </div>
    </div>
</div>

<script>
    // ==========================================
    // 1. 龐大的劇本資料庫 (140+ 組)
    // ==========================================
    const storyDB = {
        // 科幻 (s01-s15)
        s01: { s: "一台佈滿戰損的重型機甲", a: "在擁擠的未來都市巷弄中與敵軍進行激烈的近身肉搏，建築物在周圍倒塌，火花四濺" },
        s02: { s: "一座巨大的太空電梯軌道", a: "纜繩斷裂，一個運輸艙在平流層失速墜落，外部摩擦產生劇烈火焰，內部人員失重飄浮" },
        s03: { s: "一位戴著發光面具的賽博龐克駭客", a: "手指在虛擬鍵盤上飛速操作，周圍的環境數據流開始具象化並崩解，防禦系統實體化發動攻擊" },
        s04: { s: "月球表面的採礦基地", a: "巨大的採礦車意外挖破了地下空洞，引發連鎖坍塌，塵埃噴射到低重力環境中" },
        s05: { s: "人類首次與巨大的外星生物接觸", a: "外星生物如山一般高，全身散發著變幻的光芒，人類探險隊在它腳下顯得極其渺小，氣氛緊張" },
        s06: { s: "一個正在建造中的戴森球結構", a: "無數的工程飛船在恆星周圍忙碌，巨大的金屬骨架在太空中緩慢組裝，恆星光芒被部分遮蔽" },
        s07: { s: "一艘太空船的反物質引擎測試", a: "引擎啟動瞬間產生耀眼的藍色能量光束，周圍空間出現扭曲波動，測試人員緊張監控數據" },
        s08: { s: "一個失控的人工智慧伺服器機房", a: "無數的紅色警報燈閃爍，冷卻系統失效噴出蒸汽，機器人手臂瘋狂地自行運作破壞設備" },
        s09: { s: "木衛二冰層下的水下城市", a: "潛水艇在發光的水下建築間穿梭，巨大的外星海洋生物在窗外游過，地熱噴泉噴發" },
        s10: { s: "一艘老舊的太空垃圾回收船", a: "機械臂正在抓取一顆巨大的廢棄衛星，周圍漂浮著各種金屬碎片，背景是地球的弧線" },
        s11: { s: "一場時間旅行實驗", a: "實驗者走進機器，周圍的光線和時間開始倒流，物體快速移動復原，最後一切靜止在過去的某個時刻" },
        s12: { s: "第一人稱視角體驗腦機介面駭入", a: "眼前的現實世界疊加了大量虛擬數據和廣告，突然視線被強制切換到另一個人的監控畫面" },
        s13: { s: "一個先進的基因工程實驗室", a: "巨大的透明培育槽中漂浮著仍在發育的人造生物，科學家穿著防護服在操作基因序列" },
        s14: { s: "火星地球化改造工程現場", a: "巨大的大氣製造機向天空噴射氣體，地面上生長出第一批實驗性植物，背景是紅色的火星天空" },
        s15: { s: "小行星帶的採礦作業", a: "採礦船使用高能雷射切割一顆富含金屬的小行星，碎石在太空中飛濺，雷射光束耀眼" },

        // 奇幻 (f01-f15)
        f01: { s: "一隻巨大的上古紅龍", a: "飛過中世紀城堡上空，噴出熊熊烈火，塔樓被點燃，守軍驚慌失措地用弓箭反擊" },
        f02: { s: "一位傳奇大法師", a: "站在冰封的湖面上高舉法杖，詠唱咒語，巨大的冰錐從地面升起，暴風雪圍繞著他旋轉" },
        f03: { s: "古代兩支龐大的軍隊交鋒", a: "數萬名士兵在平原上衝鋒碰撞，塵土飛揚，旗幟揮舞，場面極其壯觀慘烈" },
        f04: { s: "一位召喚師", a: "在魔法陣中召喚出高達百米的岩石巨人，巨人從地面拔地而起，身上掛著泥土和樹木" },
        f05: { s: "一名戰士騎乘著獅鷲獸", a: "在壯麗的雲海中高速飛行，陽光穿透雲層，他們俯衝穿過險峻的山峰" },
        f06: { s: "一位死靈法師在古代墓地", a: "高舉法杖詠唱咒語，地面裂開，無數骷髏士兵從土裡爬出，組成亡靈大軍" },
        f07: { s: "漂浮在空中的奇幻島嶼", a: "島嶼之間爆發空戰，騎著飛龍的騎士與駕駛魔法飛艇的軍隊交火，魔法光束在空中交織" },
        f08: { s: "一片夜間發光的魔法森林", a: "所有植物都散發著柔和的生物螢光，精靈在樹木間飛舞，獨角獸在林間漫步" },
        f09: { s: "一座活火山內部的矮人鍛造廠", a: "矮人工匠利用岩漿的熱量鍛造魔法武器，巨大的鐵鎚敲擊聲迴盪，火星四射" },
        f10: { s: "精靈弓箭手防守巨樹城市", a: "站在巨大的世界樹枝幹上，向下方的獸人軍隊射出魔法箭矢，箭矢在空中分裂追蹤目標" },
        f11: { s: "一隻深海巨妖克拉肯", a: "巨大的觸手纏繞住一艘木造帆船，將其拖入暴風雨的大海中，船員驚恐地反擊" },
        f12: { s: "一個魔法競技場", a: "兩位強大的法師進行決鬥，火焰與閃電法術在空中碰撞爆炸，觀眾在防護罩後歡呼" },
        f13: { s: "探險家發現古代文明遺跡", a: "推開佈滿藤蔓的石門，發現一座巨大的地下神廟，神廟中心的水晶開始發光運作" },
        f14: { s: "一個神秘的魔法傳送門", a: "在荒野中突然開啟，門內展現出另一個世界的景象，奇怪的生物開始從門內走出" },
        f15: { s: "一場召喚惡魔的儀式", a: "邪教徒圍繞著燃燒的五芒星陣，地面裂開，一隻巨大的惡魔手臂從地獄火中伸出" },

        // Cosplay (c01-c05)
        c01: { s: "一位戴著圓框眼鏡的少年法師", a: "騎著飛天掃帚在霍格華茲風格的城堡塔樓間高速追逐金色飛賊" },
        c02: { s: "一位身穿紅金配色高科技裝甲的英雄", a: "在空中以超音速飛行，掌心發射能量衝擊波，背後有推進器火焰軌跡" },
        c03: { s: "一位綠髮紫西裝的瘋狂小丑", a: "站在燃燒的警車上瘋狂大笑，手裡拿著撲克牌，背景是混亂的哥譚市" },
        c04: { s: "一位手持紅色光劍的黑武士", a: "在充滿迷霧的走廊中緩慢逼近，呼吸聲沉重，光劍照亮了周圍的黑暗" },
        c05: { s: "一位召喚冰雪的藍裙女王", a: "赤腳走在冰面上，雙手揮舞召喚出巨大的冰雪城堡，魔法雪花在周圍環繞" },

        // 荒誕 (a01-a15)
        a01: { s: "我與一隻表情淡定的駱駝", a: "擠在狹小的商務電梯裡，周圍上班族假裝沒看見，駱駝在嚼我的領帶" },
        a02: { s: "一隻巨大的座頭鯨", a: "在雲海之上優雅地游動，身上長滿了發光植物，彷彿在深海中一樣" },
        a03: { s: "一個超現實的達利風格沙漠", a: "巨大的時鐘像起司一樣掛在樹枝上融化，時間與空間扭曲變形" },
        a04: { s: "一隻哥吉拉大小的橘貓", a: "把行駛中的火車當成逗貓棒撥弄，城市在牠腳下如同玩具模型" },
        a05: { s: "一場奇怪的暴雨", a: "天空落下的不是雨水而是無數條活蹦亂跳的魚，人們撐著傘驚訝地躲避" },
        a06: { s: "一個繁忙的都市街頭", a: "所有行人的頭部都變成了播放著雜訊的老式電視機，但他們依然正常行走生活" },
        a07: { s: "一個普通的房間內部", a: "地心引力隨意切換方向，家具和居住者在牆壁、天花板和地板之間不斷掉落" },
        a08: { s: "一座通往天空深處的樓梯", a: "樓梯無限延伸，周圍漂浮著巨大的門，人們走進門裡就會消失在虛空中" },
        a09: { s: "一個完全由書籍組成的人", a: "走在圖書館裡，他的身體隨著移動不斷掉落書頁，又重新組合成形" },
        a10: { s: "一條正常的河流", a: "河裡漂浮著無數隻巨大的黃色橡皮鴨，它們像軍隊一樣整齊地順流而下" },
        a11: { s: "一場傾盆大雨", a: "天空落下的不是雨滴，而是無數顆眨著眼睛的人類眼球，在地面彈跳" },
        a12: { s: "一個陽光明媚的廣場", a: "行人的影子突然擁有了自己的生命，脫離本體開始跳舞、打架或逃跑" },
        a13: { s: "一個所有東西都是毛皮製成的房間", a: "牆壁、家具、甚至餐具都覆蓋著厚厚的棕色毛皮，風吹過時毛皮會波動" },
        a14: { s: "一個家庭客廳", a: "沙發、桌子和檯燈長出了嘴巴和眼睛，正在進行一場激烈的爭論" },
        a15: { s: "一個顛倒的世界", a: "魚在空氣中游動，鳥在水裡飛翔，人們頭下腳上地行走" },

        // 自然 (n01-n15)
        n01: { s: "無人機視角穿越噴發的火山口", a: "滾燙的岩漿在下方翻騰噴濺，黑煙與閃電交織，鏡頭極限貼近熔岩" },
        n02: { s: "一片阿凡達式的發光森林", a: "所有植物都散發著生物螢光，奇怪的發光昆蟲在空中飛舞，充滿神秘感" },
        n03: { s: "極地巨大的冰川", a: "發生大規模崩解，數百萬噸的冰塊墜入海中，激起巨大的海嘯與白色水霧" },
        n04: { s: "深海巨型烏賊", a: "在黑暗的深淵中用觸手捕捉獵物，身上閃爍著變幻莫測的生物光芒" },
        n05: { s: "超級風暴雲結構", a: "在廣闊的平原上空旋轉，閃電在雲層內部頻繁閃爍，慢動作展現雲氣的流動" },
        n06: { s: "壯麗的極光大爆發", a: "在雪山與冰湖上空舞動，綠色、紫色和粉紅色的光帶充滿整個夜空，倒映在水面" },
        n07: { s: "百萬隻角馬大遷徙", a: "在塵土飛揚中橫渡充滿鱷魚的河流，場面混亂壯觀，展現生命的頑強" },
        n08: { s: "花朵綻放的超高速縮時攝影", a: "從花苞到盛開的過程在幾秒鐘內完成，展現植物生長的動態美感" },
        n09: { s: "微距鏡頭下的昆蟲世界", a: "一隻螞蟻在巨大的露珠前停留，露珠倒映著周圍的花朵，細節清晰可見" },
        n10: { s: "潛水員探索水下洞穴", a: "手電筒的光束照亮古老的鐘乳石和清澈的藍水，偶爾有盲魚游過" },
        n11: { s: "撒哈拉沙漠的巨大沙塵暴", a: "像一堵高達數千米的牆壁席捲而來，吞沒了一支駱駝商隊，天空變成橘紅色" },
        n12: { s: "閃電擊中海面的瞬間", a: "超慢動作捕捉到巨大的閃電束擊中波濤洶湧的海面，激起巨大的水花和蒸汽" },
        n13: { s: "充滿迷霧的巨型紅杉林", a: "陽光穿透樹冠形成丁達爾光束，巨大的樹幹高聳入雲，彷彿置身史前世界" },
        n14: { s: "數萬隻椋鳥的群飛舞蹈", a: "在黃昏的天空中形成變幻莫測的巨大圖案，像液體一樣流動變形" },
        n15: { s: "火山爆發產生的火山閃電", a: "巨大的火山灰雲中閃爍著密集的靜電閃電，岩漿彈射向夜空" },

        // 日常 (l01-l15)
        l01: { s: "東京新宿的雨夜街頭", a: "霓虹燈在濕滑的地面反射出五光十色，路人撐傘匆忙走過，充滿電影氛圍" },
        l02: { s: "一位米其林大廚", a: "在火熱的廚房中用慢動作烹飪，火焰在平底鍋上騰起，展現食材的極致細節" },
        l03: { s: "一輛復古敞篷跑車", a: "在加州海岸公路上行駛，正值黃金時刻夕陽，風吹動頭髮，氛圍自由愜意" },
        l04: { s: "紐約時代廣場", a: "從白天到黑夜的超高速縮時攝影，人潮與車流化為光影軌跡，廣告牌瘋狂閃爍" },
        l05: { s: "一位日本職人", a: "在昏暗的鍛造場中手工鍛造武士刀，鐵鎚敲擊紅熱的鋼鐵，火星四射" },
        l06: { s: "雨天溫暖的咖啡館內部", a: "人們在窗邊閱讀喝咖啡，窗外是模糊的雨景和行人，氣氛寧靜舒適" },
        l07: { s: "一位街頭藝人", a: "在歐洲古老的廣場上演奏小提琴，鴿子在周圍飛舞，路人駐足欣賞並投幣" },
        l08: { s: "夜晚的地鐵列車", a: "在城市高架橋上飛馳而過，車窗透出溫暖的光，背景是城市的萬家燈火" },
        l09: { s: "繁忙的東京築地魚市場", a: "清晨時分，漁販們忙碌地搬運巨大的鮪魚，拍賣聲此起彼落，充滿活力" },
        l10: { s: "一位陶藝家", a: "專注地在拉胚機上製作陶器，雙手沾滿泥土，陶土在手中逐漸成形" },
        l11: { s: "一對情侶", a: "在城市摩天大樓的屋頂上跳舞，背景是壯觀的城市夜景和星空，氛圍浪漫" },
        l12: { s: "一座充滿灰塵的古老圖書館", a: "陽光從高窗射入，照亮空氣中飛舞的塵埃，一位老人正在翻閱巨大的古書" },
        l13: { s: "繁忙的國際機場航廈", a: "縮時攝影展現旅客匆忙的流動，飛機在窗外起降，展現全球化的繁忙景象" },
        l14: { s: "無人機空拍蜿蜒的山路", a: "一輛汽車在壯麗的秋季山林間行駛，道路如同絲帶般盤繞在山腰" },
        l15: { s: "盛大的夏季煙火大會", a: "巨大的煙火在城市上空綻放，照亮了河岸邊擁擠的人群，人們穿著浴衣歡呼" },

        // 驚悚 (t01-t15)
        t01: { s: "第一人稱視角(GoPro)", a: "在狹窄廢棄的走廊狂奔，回頭看見成群喪屍瘋狂追逐，呼吸急促畫面晃動" },
        t02: { s: "一位女子在照鏡子", a: "鏡子裡的倒影突然停止動作，露出詭異微笑，而本人還在動" },
        t03: { s: "手持攝影機探險廢棄精神病院", a: "手電筒光束掃過剝落牆壁和生鏽輪椅，前方陰影處傳來不明動靜" },
        t04: { s: "濃霧瀰漫的小鎮", a: "迷霧中緩慢浮現出巨大的克蘇魯觸手輪廓，警報聲響起，人們四處逃竄" },
        t05: { s: "監視器畫面", a: "顯示空無一人的房間裡，椅子突然自己移動，門猛烈關上，靈異現象頻發" },
        t06: { s: "深夜公園的跟蹤者視角", a: "手持攝影機躲在樹叢後，拍攝前方獨自行走的目標，呼吸聲沉重壓抑" },
        t07: { s: "一個恐怖的陶瓷人偶", a: "坐在昏暗的房間角落，當鏡頭移開再轉回來時，它的頭部轉向了鏡頭方向" },
        t08: { s: "一隻蒼白的手", a: "緩慢地從床底下伸出，試圖抓住熟睡中人的腳踝，氣氛極度緊張" },
        t09: { s: "下水道裡的詭異小丑", a: "只露出一雙發光的眼睛和紅色的氣球，在黑暗的深處發出令人毛骨悚然的笑聲" },
        t10: { s: "一座鬧鬼的維多利亞式老宅外觀", a: "在雷雨夜的閃電中顯現，窗戶裡閃過不明的人影，大門自行緩慢打開" },
        t11: { s: "夜晚充滿迷霧的詭異森林", a: "主角迷路其中，樹木看起來像扭曲的人形，周圍傳來竊竊私語的聲音" },
        t12: { s: "家庭監視器錄像", a: "顯示一個戴著面具的入侵者在客廳裡靜靜地站著，看著熟睡的屋主" },
        t13: { s: "恐慌室內的緊急封鎖", a: "一家人躲在狹小的安全屋內，看著監視器畫面，外面的暴力入侵者正在試圖破門" },
        t14: { s: "深夜的高速公路飛車追逐", a: "一輛神秘的黑色卡車緊追不捨，不斷撞擊主角的車輛，試圖將其逼出道路" },
        t15: { s: "詭異的邪教儀式現場", a: "一群穿著長袍的人圍繞著篝火吟唱，祭壇上放著奇怪的符號，氣氛壓抑恐怖" },

        // 復古 (r01-r15)
        r01: { s: "80年代電視廣告風格", a: "畫面帶有強烈的VHS錄影帶雜訊、色彩失真和波浪扭曲，充滿懷舊感" },
        r02: { s: "一部黑白黑色電影(Film Noir)", a: "偵探在煙霧繚繞的辦公室裡抽菸，百葉窗投下條紋陰影，氣氛壓抑" },
        r03: { s: "一座蒸汽龐克城市", a: "充滿黃銅齒輪、蒸汽管道和飛艇，人們穿著維多利亞時期服裝搭配機械配件" },
        r04: { s: "莫內印象派油畫風格的田園", a: "畫面由粗糙的筆觸和豐富的色彩構成，風吹動麥田和罌粟花，光影朦朧" },
        r05: { s: "定格黏土動畫風格", a: "一隻黏土怪物在城市中笨拙地移動，可以看見黏土上的指紋和逐格動畫的停頓感" },
        r06: { s: "20年代默片風格", a: "黑白畫面，帶有膠片刮痕和閃爍，演員進行誇張的肢體表演，有間幕字幕卡" },
        r07: { s: "像素藝術遊戲風格動畫", a: "8位元風格的勇者在地下城中戰鬥，畫面充滿方塊感和電子音效" },
        r08: { s: "蒸氣波美學的城市景觀", a: "充滿粉色和紫色的霓虹燈、羅馬雕塑、舊電腦視窗和棕櫚樹，畫面帶有故障效果" },
        r09: { s: "文藝復興時期繪畫風格", a: "畫面如同達文西的油畫動了起來，描繪一場宮廷宴會，光影柔和筆觸細膩" },
        r10: { s: "50年代科幻B級片質感", a: "穿著笨重道具服的外星人拿著玩具槍攻擊人類，畫面粗糙，充滿廉價特效感" },
        r11: { s: "抽象幾何圖形的動態藝術", a: "各種顏色的方塊、圓形和線條在畫布上隨著音樂節奏移動、變形和組合" },
        r12: { s: "水彩風景畫動畫", a: "色彩在紙上暈染流動，描繪出一幅山水田園的景象，充滿詩意和透明感" },
        r13: { s: "炭筆素描風格動畫", a: "畫面由黑白線條和陰影構成，描繪一個人在雨中行走的孤獨場景，筆觸粗獷" },
        r14: { s: "野獸派建築導覽影片", a: "粗糙的混凝土建築在陰天顯得巨大而壓抑，強調幾何結構和功能主義" },
        r15: { s: "迷幻的60年代旅程", a: "畫面充滿旋轉的萬花筒圖案、鮮豔的色彩和變形的人臉，充滿嬉皮文化風格" },

        // 歷史 (h01-h15) - NEW
        h01: { s: "羅馬軍團行軍", a: "數千名裝備精良的羅馬士兵排成方陣，在石板路上整齊行軍，鷹旗在前方引導" },
        h02: { s: "建造金字塔的場景", a: "數萬名工人在烈日下使用繩索和滾木拉動巨大的石塊，巨大的金字塔已具雛形" },
        h03: { s: "維京長船航行", a: "一隊維京長船在波濤洶湧的北海上航行，船頭雕刻著龍頭，戰士們奮力划槳" },
        h04: { s: "櫻花樹下的武士決鬥", a: "兩位日本武士在飄落的櫻花雨中進行生死決鬥，武士刀碰撞發出清脆聲響" },
        h05: { s: "二戰空中纏鬥", a: "噴火式戰鬥機與Bf 109在英吉利海峽上空激烈交火，機槍曳光彈在空中交織，飛機冒煙墜落" },
        h06: { s: "古希臘議會辯論", a: "哲學家和公民在雅典衛城的露天劇場進行激烈的政治辯論，背景是帕德嫩神廟" },
        h07: { s: "西部牛仔正午決鬥", a: "兩位槍手在塵土飛揚的小鎮大街上對峙，手放在槍套上，氣氛凝重，風滾草吹過" },
        h08: { s: "中世紀騎士長槍比武", a: "兩位穿著全套盔甲的騎士騎馬衝鋒，長槍在碰撞瞬間折斷，木片飛濺，觀眾歡呼" },
        h09: { s: "工業革命時期的工廠內部", a: "巨大的蒸汽機在轟鳴，齒輪轉動，工人在煙霧繚繞的環境中忙碌工作，充滿機械感" },
        h10: { s: "鐵達尼號啟航出港", a: "巨大的豪華郵輪在眾人的歡呼聲中駛離南安普敦港，煙囪冒著黑煙，場面壯觀" },
        h11: { s: "秦始皇陵兵馬俑復活", a: "地下陵墓中的數千個兵馬俑陶俑突然抖落塵土，眼睛發光，開始活動並組成軍隊" },
        h12: { s: "美國獨立戰爭戰場", a: "大陸軍與英軍排成橫隊互射火槍，煙霧瀰漫戰場，鼓手在後方擊鼓激勵士氣" },
        h13: { s: "文藝復興時期威尼斯嘉年華", a: "人們戴著華麗的面具穿著盛裝在運河邊慶祝，貢多拉船在水面穿梭，煙火綻放" },
        h14: { s: "古代瑪雅城市的祭典", a: "祭司在巨大的金字塔頂端進行儀式，廣場上聚集了數萬名朝聖者，背景是茂密的叢林" },
        h15: { s: "冷戰時期柏林圍牆檢查哨", a: "士兵在查理檢查哨嚴密盤查過往車輛，探照燈掃視圍牆，氣氛緊張壓抑" },

        // 極限 (x01-x15) - NEW
        x01: { s: "飛鼠裝滑翔穿越山谷", a: "極限運動員穿著飛鼠裝從高山跳下，以極快的速度貼近峭壁和樹梢滑翔" },
        x02: { s: "巨浪衝浪者", a: "衝浪者在葡萄牙納扎雷挑戰二十米高的巨浪，在水牆中高速滑行，場面驚險" },
        x03: { s: "F1賽車進站換胎", a: "賽車駛入維修站，技師團隊在兩秒內完成換胎作業，動作精準同步，充滿機械美感" },
        x04: { s: "城市屋頂跑酷", a: "跑酷選手在密集的城市屋頂間跳躍、翻滾，跨越巨大的間隙，視角驚險刺激" },
        x05: { s: "徒手攀岩險峻懸崖", a: "攀岩者在沒有繩索保護的情況下攀登垂直的岩壁，手指扣住微小的岩點，展現極致的體能" },
        x06: { s: "電影感的籃球灌籃", a: "球員在比賽中高高躍起，在慢動作中完成一記強力的戰斧式灌籃，籃框劇烈晃動" },
        x07: { s: "下坡山地自行車賽", a: "車手在崎嶇的山林賽道上高速俯衝，騰空飛越障礙，泥土飛濺，視角極具速度感" },
        x08: { s: "深海自由潛水", a: "潛水員在不攜帶氣瓶的情況下潛入深海藍洞，周圍是一片幽靜的藍色，展現人類潛能" },
        x09: { s: "滑板慢動作特技", a: "滑板選手在U型池中騰空做出複雜的翻板動作，超慢動作捕捉滑板翻轉的細節" },
        x10: { s: "單板滑雪粉雪衝刺", a: "滑雪者在深厚的粉雪中高速滑降，激起巨大的雪浪，背景是壯觀的雪山" },
        x11: { s: "摩托車越野飛躍", a: "越野摩托車手在土坡上騰空飛躍數十米，在空中做出特技動作，引擎轟鳴" },
        x12: { s: "高空跳傘自由落體", a: "跳傘者從飛機上一躍而下，在萬米高空進行自由落體編隊，背景是地球的曲線" },
        x13: { s: "冰上曲棍球激烈碰撞", a: "球員在高速滑行中進行強力的身體衝撞，冰屑飛濺，球桿斷裂，比賽充滿火藥味" },
        x14: { s: "拳擊賽最後一回合擊倒", a: "拳擊手在最後一秒擊出一記重拳，對手慢動作倒地，汗水飛濺，觀眾瘋狂吶喊" },
        x15: { s: "極限BMX單車特技", a: "BMX車手在街頭道具上做出複雜的旋轉和平衡動作，展現精湛的控車技巧" }
    };

    // ==========================================
    // 2. 擴充的導演風格庫 (18位大師)
    // ==========================================
    const directorDB = {
        nolan: "克里斯多福·諾蘭(Christopher Nolan)風格，IMAX 70mm 膠片質感，極致寫實主義，冷冽色調，強調實拍物理特效，史詩感配樂氛圍",
        lucas: "喬治·盧卡斯(George Lucas)風格，史詩太空歌劇美學，工業科幻感，宏大的背景世界觀，豐富的CGI生物與載具，充滿冒險感",
        wes: "魏斯·安德森(Wes Anderson)風格，強迫症般的完美對稱構圖，高飽和度粉彩色調，平面化視角，充滿童話感與怪誕幽默",
        wong: "王家衛(Wong Kar-wai)風格，標誌性的抽幀與慢快門效果，濃郁的霓虹色彩，迷離曖昧的氛圍，手持鏡頭晃動，情感強烈",
        bay: "麥可·貝(Michael Bay)風格，好萊塢商業大片質感，高對比度橙藍色調(Teal & Orange)，標誌性的旋轉運鏡，逆光夕陽，史詩般的慢動作與爆炸",
        burton: "提姆·波頓(Tim Burton)風格，哥德式暗黑美學，高對比陰影，扭曲的建築線條，蒼白的人物，奇幻且略帶恐怖的氛圍",
        miyazaki: "宮崎駿(Hayao Miyazaki)吉卜力風格，溫暖的手繪水彩質感，清新的藍天白雲與飛行場景，豐富的自然細節，充滿童真與奇幻",
        villeneuve: "丹尼·維勒納夫(Denis Villeneuve)風格，極簡主義的巨大沉默物體(BDO)，壓抑的氣氛，單色調冷光，強調環境的廣闊與人類的渺小",
        hitchcock: "亞佛烈德·希區考克(Alfred Hitchcock)風格，經典懸疑驚悚片質感，精心設計的推軌鏡頭與變焦，強調心理壓力的光影運用",
        lynch: "大衛·林區(David Lynch)風格，夢境般的超現實主義，令人不安的氛圍，詭異的燈光與色彩，非線性的敘事感，潛意識的恐懼",
        kubrick: "史丹利·庫柏力克(Stanley Kubrick)風格，冷峻對稱的構圖，緩慢而壓抑的推軌鏡頭(Slow Dolly)，極致的細節控制，令人不安的完美感",
        deltoro: "吉勒摩·戴爾·托羅(Guillermo del Toro)風格，暗黑童話美學，精緻的怪物設計，琥珀色與青色的色調，充滿發條機械與奇幻生物的世界",
        anime_cyber: "賽博龐克動畫風格(如《攻殼機動隊》)，高密度的城市資訊流，霓虹閃爍的雨夜，機械義體細節，數位與現實交錯的視覺效果",
        noir_comic: "黑色漫畫風格(如《萬惡城市》)，極致的高對比度黑白畫面，僅保留特定色彩（如紅色血液），粗糙的漫畫筆觸與陰影質感",
        tarantino: "昆汀·塔倫提諾(Quentin Tarantino)風格，強烈的暴力美學，鮮豔飽和的色彩，獨特的低角度仰拍(Trunk Shot)或腳部特寫，充滿張力的對峙場面，復古膠片顆粒感，非線性敘事的氛圍",
        kitano: "北野武(Takeshi Kitano)風格，標誌性的「北野藍」冷色調，極簡主義構圖，長時間的靜止鏡頭突然爆發瞬間暴力，冷面幽默感，孤獨且疏離的氛圍，通常涉及黑幫或海邊場景",
        kurosawa: "黑澤明(Akira Kurosawa)風格，史詩般的壯闊感，強調自然元素（狂風、暴雨、泥濘）的動態視覺，使用長焦鏡頭壓縮畫面空間感，激烈的武士戰鬥或大規模人群調度，強烈的人文主義色彩"
    };

    // ==========================================
    // 核心功能函數
    // ==========================================
    function updatePreview() {
        const key = document.getElementById('storySelect').value;
        if (!key || !storyDB[key]) return;
        const story = storyDB[key];
        // 修改預覽文字，強調主角是「我」，但不再強調視角
        document.getElementById('storyPreview').innerText = `預覽：主角「我」身處${story.s}，正在${story.a}。`;
        document.getElementById('storyPreview').style.borderColor = 'var(--accent-gold)';
    }

    function randomScript() {
        const keys = Object.keys(storyDB);
        if (keys.length === 0) return;
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        document.getElementById('storySelect').value = randomKey;
        updatePreview();
        const preview = document.getElementById('storyPreview');
        preview.style.backgroundColor = '#fffbeb';
        setTimeout(() => { preview.style.backgroundColor = 'rgba(255, 215, 0, 0.08)'; }, 200);
    }

    function getCheckedValues(name) {
        return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);
    }

    function generate() {
        const storyKey = document.getElementById('storySelect').value;
        if (!storyKey || !storyDB[storyKey]) { alert("請先選擇一個劇本！"); return; }
        const story = storyDB[storyKey];
        const directorKey = document.querySelector('input[name="director"]:checked').value;
        const directorStyle = directorDB[directorKey];
        const cameras = getCheckedValues('camera');
        const vfxs = getCheckedValues('vfx');
        const twists = getCheckedValues('twist');
        
        // 定義主角身份
        const protagonist = "主角「我」(@tonkhsueh)";

        const cameraStr = cameras.length > 0 ? "運鏡技巧：" + cameras.join("，") + "。" : "";
        const vfxStr = vfxs.length > 0 ? "視覺特效：" + vfxs.join("，") + "。" : "";
        const twistStr = twists.length > 0 ? `⚠️影片中途發生超現實轉折：${twists.join("，並且")}。畫面物理法則崩壞，視覺衝擊力極強。` : "";

        // =================================================================
        // Master Prompt 生成邏輯 (核心修改處)
        // =================================================================
        let master = `【電影級指令】生成一段高品質影片。${directorStyle}。\n`;
        // 強調主角身份，但解除鏡頭限制，讓鏡頭跟隨主角行動
        master += `【核心要求】影片核心主角由${protagonist}飾演。鏡頭重點跟隨主角的行動與反應，展現強烈的電影感。\n`;
        // 描述主角身處的環境和動作
        master += `【劇情內容】${protagonist}身處於這樣的場景：${story.s}，並且正在${story.a}。\n`;
        master += `【技術細節】${cameraStr} ${vfxStr}\n`;
        master += `【畫質要求】8k解析度，極致細節，電影感光影，高動態範圍(HDR)。\n`;
        master += twistStr;

        // =================================================================
        // Timeline Script 生成邏輯 (核心修改處)
        // =================================================================
        let timeline = `**劇本代號：** ${storyKey.toUpperCase()}\n**導演風格：** ${directorKey.toUpperCase()}\n`;
        timeline += `**主演：** ${protagonist}\n\n`;

        // 修改開場描述，不再強制主觀視角，而是描述鏡頭捕捉主角
        timeline += `[00s-05s] 開場建立：鏡頭捕捉到${protagonist}。場景是${story.s}，主角正在${story.a}。採用${directorKey}導演獨特的鏡頭語言與場面調度。\n\n`;
        
        if (twists.length > 0) {
            // 修改轉折描述，強調發生在主角周圍
            timeline += `[05s-08s] 劇情轉折：突然，在${protagonist}周圍，${twists.join("，並且")}。世界的規則發生劇烈變化，主角感到震驚。\n\n`;
            timeline += `[08s-10s] 結局收尾：鏡頭記錄下這一切不可思議的變化，最後淡出。`;
        } else {
            timeline += `[05s-08s] 衝突升級：${protagonist}的動作更加激烈，加入${vfxs.length > 0 ? vfxs.join("與") : "更多環境細節"}，展現極致的視覺張力。\n\n`;
            timeline += `[08s-10s] 高潮結尾：將${directorKey}風格推向極致，完美收鏡。`;
        }

        document.getElementById('resultSection').style.display = 'block';
        document.getElementById('masterPrompt').innerText = master;
        document.getElementById('timelinePrompt').innerText = timeline;
        document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
    }

    function copyResult(id) {
        const text = document.getElementById(id).innerText;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector(`#${id} + .copy-btn`) || document.querySelector(`#${id}`).parentElement.querySelector('.copy-btn');
            const originalText = btn.innerText;
            btn.innerText = "已複製！";
            btn.style.background = "white"; btn.style.color = "black";
            setTimeout(() => {
                btn.innerText = originalText; btn.style.background = "#333"; btn.style.color = "white";
            }, 1500);
        });
    }
    
    // 初始化檢查
    if (Object.keys(storyDB).length > 0) { updatePreview(); }
</script>

</body>
</html>
