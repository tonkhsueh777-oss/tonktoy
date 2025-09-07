# tonktoy
t
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>薛導自制即夢AI提示词工具</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            color: #333;
            min-height: 100vh;
            padding: 15px;
        }
        
        .container {
            max-width: 100%;
            margin: 0 auto;
        }
        
        header {
            text-align: center;
            padding: 20px 0;
            margin-bottom: 20px;
            color: white;
        }
        
        h1 {
            font-size: 2rem;
            margin-bottom: 8px;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
            font-weight: 600;
        }
        
        .subtitle {
            font-size: 0.95rem;
            max-width: 100%;
            margin: 0 auto;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .main-content {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .input-section {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .output-section {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
        }
        
        .control-group {
            margin-bottom: 20px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .control-group h3 {
            margin-bottom: 12px;
            color: #2c3e50;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }
        
        .control-group h3 i {
            color: #6a11cb;
        }
        
        textarea {
            width: 100%;
            height: 100px;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #ddd;
            resize: vertical;
            font-size: 0.95rem;
        }
        
        select {
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #ddd;
            background: white;
            font-size: 0.95rem;
            margin-bottom: 8px;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236a11cb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 12px center;
            background-size: 16px;
        }
        
        .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }
        
        .checkbox-item {
            display: flex;
            align-items: center;
            background: #e9ecef;
            padding: 6px 12px;
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.85rem;
        }
        
        .checkbox-item:hover {
            background: #dee2e6;
        }
        
        .checkbox-item input {
            margin-right: 4px;
        }
        
        .slider-container {
            margin: 12px 0;
        }
        
        .slider-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 0.9rem;
        }
        
        input[type="range"] {
            width: 100%;
            height: 6px;
            -webkit-appearance: none;
            background: #e9ecef;
            border-radius: 5px;
            outline: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #6a11cb;
            cursor: pointer;
        }
        
        .btn {
            display: inline-block;
            padding: 14px 20px;
            background: #6a11cb;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            transition: all 0.2s;
            margin-top: 10px;
            width: 100%;
            box-shadow: 0 4px 10px rgba(106, 17, 203, 0.3);
        }
        
        .btn:hover {
            background: #2575fc;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(37, 117, 252, 0.4);
        }
        
        .btn-copy {
            background: #27ae60;
            margin-top: auto;
            box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3);
        }
        
        .btn-copy:hover {
            background: #219653;
            box-shadow: 0 6px 15px rgba(33, 150, 83, 0.4);
        }
        
        .output-prompt {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
            min-height: 150px;
            margin-top: 15px;
            flex-grow: 1;
            white-space: pre-wrap;
            overflow-y: auto;
            border: 1px solid #e9ecef;
            font-family: 'Courier New', monospace;
            line-height: 1.5;
            font-size: 0.9rem;
        }
        
        .character-count {
            text-align: right;
            color: #6c757d;
            font-size: 0.8rem;
            margin-top: 5px;
        }
        
        footer {
            text-align: center;
            padding: 15px;
            color: white;
            font-size: 0.8rem;
            opacity: 0.8;
        }
        
        .tooltip {
            position: relative;
            display: inline-block;
            margin-left: 5px;
            color: #6a11cb;
        }
        
        .tooltip .tooltiptext {
            visibility: hidden;
            width: 160px;
            background-color: #555;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 5px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -80px;
            opacity: 0;
            transition: opacity 0.3s;
            font-size: 0.8rem;
        }
        
        .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
        }
        
        .lens-composition-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .advanced-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            padding: 10px;
            background: #e9ecef;
            border-radius: 8px;
            margin-top: 10px;
            font-weight: 500;
        }
        
        .advanced-settings {
            display: none;
            margin-top: 12px;
            padding: 12px;
            background: #e9ecef;
            border-radius: 8px;
        }
        
        .tag {
            display: inline-block;
            background: #6a11cb;
            color: white;
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 0.7rem;
            margin-right: 4px;
            margin-bottom: 4px;
        }
        
        .creativity-indicator {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
        }
        
        .creativity-level {
            text-align: center;
            padding: 4px 6px;
            border-radius: 4px;
            font-size: 0.75rem;
            background: #e9ecef;
            flex: 1;
            margin: 0 2px;
        }
        
        .creativity-level.active {
            background: #6a11cb;
            color: white;
        }
        
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 26px;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 26px;
        }
        
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
            background-color: #6a11cb;
        }
        
        input:checked + .toggle-slider:before {
            transform: translateX(24px);
        }
        
        .toggle-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
            background: rgba(106, 17, 203, 0.1);
            padding: 12px;
            border-radius: 10px;
        }
        
        .toggle-label {
            font-weight: 500;
            color: #6a11cb;
            font-size: 0.95rem;
        }
        
        .loading {
            display: none;
            text-align: center;
            padding: 8px;
            color: #6a11cb;
            font-size: 0.9rem;
        }
        
        .example-cards {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 15px;
        }
        
        .example-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.2s;
            border-left: 4px solid #6a11cb;
        }
        
        .example-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        .example-card h3 {
            color: #6a11cb;
            margin-bottom: 8px;
            font-size: 1rem;
        }
        
        .example-card p {
            font-size: 0.85rem;
            color: #6c757d;
            margin-bottom: 8px;
        }

        /* 新增样式 */
        .history-section {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            display: none;
        }
        
        .history-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
        }
        
        .history-item:hover {
            background-color: #f8f9fa;
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: #27ae60;
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 1000;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        @media (min-width: 768px) {
            .container {
                max-width: 750px;
            }
            
            .main-content {
                flex-direction: row;
            }
            
            .input-section, .output-section {
                flex: 1;
            }
            
            h1 {
                font-size: 2.5rem;
            }
            
            .subtitle {
                font-size: 1.1rem;
                max-width: 80%;
            }
        }
        
        @media (min-width: 1200px) {
            .container {
                max-width: 1140px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1><i class="fas fa-robot"></i> 即夢AI提示词工具</h1>
            <p class="subtitle">专注于文本提示词生成，创造高质量AI图像</p>
        </header>
        
        <div class="main-content">
            <div class="input-section">
                <div class="toggle-container">
                    <span class="toggle-label">根据这个图生成提示词</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="basedOnImage">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                
                <div class="control-group">
                    <h3><i class="fas fa-pencil-alt"></i> 基本提示</h3>
                    <textarea id="basicPrompt" placeholder="例如：一位年轻女子站在城市天台，望着远方"></textarea>
                    <div class="character-count">字数: <span id="basicCount">0</span></div>
                </div>
                
                <div class="control-group">
                    <h3><i class="fas fa-palette"></i> 风格选择</h3>
                    <select id="styleSelect">
                        <option value="">-- 选择风格 --</option>
                        <option value="写实风格">写实风格</option>
                        <option value="电影风格">电影风格</option>
                        <option value="卡通风格">卡通风格</option>
                        <option value="油画风格">油画风格</option>
                        <option value="水彩风格">水彩风格</option>
                        <option value="赛博朋克">赛博朋克风格</option>
                        <option value="复古风格">复古风格</option>
                        <option value="极简主义">极简主义</option>
                        <option value="未来主义">未来主义</option>
                    </select>
                </div>
                
                <div class="control-group">
                    <h3><i class="fas fa-camera"></i> 镜头与构图</h3>
                    <div class="lens-composition-grid">
                        <div>
                            <h4>镜头类型</h4>
                            <select id="lensType">
                                <option value="">-- 选择镜头 --</option>
                                <option value="超广角镜头">超广角镜头</option>
                                <option value="广角镜头">广角镜头</option>
                                <option value="标准镜头">标准镜头</option>
                                <option value="长焦镜头">长焦镜头</option>
                                <option value="超长焦镜头">超长焦镜头</option>
                                <option value="微距镜头">微距镜头</option>
                                <option value="鱼眼镜头">鱼眼镜头</option>
                            </select>
                        </div>
                        <div>
                            <h4>构图技巧</h4>
                            <select id="compositionType">
                                <option value="">-- 选择构图 --</option>
                                <option value="对称构图">对称构图</option>
                                <option value="三分法构图">三分法构图</option>
                                <option value="黄金分割构图">黄金分割构图</option>
                                <option value="引导线构图">引导线构图</option>
                                <option value="框架构图">框架构图</option>
                                <option value="填充式构图">填充式构图</option>
                                <option value="留白构图">留白构图</option>
                                <option value="对角线构图">对角线构图</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="lens-composition-grid" style="margin-top: 12px;">
                        <div>
                            <h4>拍摄角度</h4>
                            <select id="shotAngle">
                                <option value="">-- 选择角度 --</option>
                                <option value="眼平视角">眼平视角</option>
                                <option value="低角度拍摄">低角度拍摄</option>
                                <option value="高角度拍摄">高角度拍摄</option>
                                <option value="鸟瞰角度">鸟瞰角度</option>
                                <option value="倾斜角度">倾斜角度</option>
                                <option value="俯视角度">俯视角度</option>
                                <option value="仰视角度">仰视角度</option>
                            </select>
                        </div>
                        <div>
                            <h4>景深控制</h4>
                            <select id="depthOfField">
                                <option value="">-- 选择景深 --</option>
                                <option value="浅景深">浅景深</option>
                                <option value="大景深">大景深</option>
                                <option value="前景模糊">前景模糊</option>
                                <option value="背景模糊">背景模糊</option>
                                <option value="移轴效果">移轴效果</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="control-group">
                    <h3><i class="fas fa-tags"></i> 添加细节</h3>
                    <div class="checkbox-group">
                        <label class="checkbox-item">
                            <input type="checkbox" value="精细纹理"> 精细纹理
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" value="光影效果"> 光影效果
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" value="环境细节"> 环境细节
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" value="情感表达"> 情感表达
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" value="动态感"> 动态感
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" value="高对比度"> 高对比度
                        </label>
                    </div>
                </div>
                
                <div class="control-group">
                    <h3>
                        <i class="fas fa-magic"></i> 创造力级别
                        <div class="tooltip">
                            <i class="fas fa-question-circle"></i>
                            <span class="tooltiptext">控制AI对提示词的解释和创造性发挥程度</span>
                        </div>
                    </h3>
                    <div class="slider-container">
                        <div class="slider-label">
                            <span>精准还原</span>
                            <span>创意发挥</span>
                        </div>
                        <input type="range" id="creativity" min="0" max="100" value="50">
                    </div>
                    <div class="creativity-indicator">
                        <div class="creativity-level" id="level1">保守</div>
                        <div class="creativity-level" id="level2">适度</div>
                        <div class="creativity-level active" id="level3">平衡</div>
                        <div class="creativity-level" id="level4">创意</div>
                        <div class="creativity-level" id="level5">大胆</div>
                    </div>
                </div>
                
                <div class="advanced-toggle" id="advancedToggle">
                    <span>进阶设置</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                
                <div class="advanced-settings" id="advancedSettings">
                    <h3><i class="fas fa-cogs"></i> 进阶设置</h3>
                    
                    <div class="slider-container">
                        <div class="slider-label">
                            <span>对比度</span>
                            <span id="contrastValue">50%</span>
                        </div>
                        <input type="range" id="contrast" min="0" max="100" value="50">
                    </div>
                    
                    <div class="slider-container">
                        <div class="slider-label">
                            <span>饱和度</span>
                            <span id="saturationValue">50%</span>
                        </div>
                        <input type="range" id="saturation" min="0" max="100" value="50">
                    </div>
                    
                    <div class="slider-container">
                        <div class="slider-label">
                            <span>亮度</span>
                            <span id="brightnessValue">50%</span>
                        </div>
                        <input type="range" id="brightness" min="0" max="100" value="50">
                    </div>
                    
                    <h4 style="margin-top: 15px;">特殊效果</h4>
                    <div class="checkbox-group">
                        <label class="checkbox-item">
                            <input type="checkbox" value="镜头光晕"> 镜头光晕
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" value="电影颗粒"> 电影颗粒
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" value="运动模糊"> 运动模糊
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" value="体积光"> 体积光
                        </label>
                    </div>
                </div>
                
                <div class="loading" id="loadingIndicator">
                    <i class="fas fa-spinner fa-spin"></i> 生成中...
                </div>
                
                <button id="generateBtn" class="btn">生成提示词</button>
                <button id="saveBtn" class="btn" style="background: #f39c12; margin-top: 10px; box-shadow: 0 4px 10px rgba(243, 156, 18, 0.3);">
                    <i class="fas fa-save"></i> 保存到历史记录
                </button>
            </div>
            
            <div class="output-section">
                <h3><i class="fas fa-scroll"></i> 生成的提示词</h3>
                <div class="output-prompt" id="outputPrompt">
                    生成的提示词将显示在这里...
                </div>
                <div class="character-count">字数: <span id="outputCount">0</span></div>
                <button id="copyBtn" class="btn btn-copy">复制提示词</button>
            </div>
        </div>
        
        <div class="history-section" id="historySection">
            <h3><i class="fas fa-history"></i> 历史记录</h3>
            <div id="historyList"></div>
        </div>
        
        <div class="control-group">
            <h3><i class="fas fa-lightbulb"></i> 提示词示例</h3>
            <div class="example-cards">
                <div class="example-card" onclick="loadExample(1)">
                    <h3>电影角色肖像</h3>
                    <p>使用长焦镜头，三分法构图，浅景深效果，创造专业电影感角色肖像</p>
                    <div>
                        <span class="tag">长焦镜头</span>
                        <span class="tag">三分法构图</span>
                        <span class="tag">浅景深</span>
                    </div>
                </div>
                <div class="example-card" onclick="loadExample(2)">
                    <h3>城市风景</h3>
                    <p>使用广角镜头，引导线构图，低角度拍摄，展现现代城市的宏伟感</p>
                    <div>
                        <span class="tag">广角镜头</span>
                        <span class="tag">引导线构图</span>
                        <span class="tag">低角度</span>
                    </div>
                </div>
                <div class="example-card" onclick="loadExample(3)">
                    <h3>产品摄影</h3>
                    <p>使用标准镜头，对称构图，微距效果，突出产品细节和质感</p>
                    <div>
                        <span class="tag">标准镜头</span>
                        <span class="tag">对称构图</span>
                        <span class="tag">微距</span>
                    </div>
                </div>
            </div>
        </div>
        
        <footer>
            <p>© 2023 即夢AI提示词工具 | 专注于文本提示词生成，创造高质量AI图像</p>
        </footer>
    </div>

    <div class="notification" id="notification">提示词已复制到剪贴板</div>

    <script>
        // 示例数据
        const examples = {
            1: {
                basic: "一位中年男子站在雨中街道上，穿着风衣，表情严肃",
                style: "电影风格",
                lensType: "长焦镜头",
                compositionType: "三分法构图",
                shotAngle: "眼平视角",
                depthOfField: "浅景深",
                details: ["光影效果", "环境细节", "精细纹理"],
                creativity: 40,
                basedOnImage: true
            },
            2: {
                basic: "未来城市天际线，霓虹灯光照亮夜空",
                style: "赛博朋克",
                lensType: "广角镜头",
                compositionType: "引导线构图",
                shotAngle: "低角度拍摄",
                depthOfField: "大景深",
                details: ["光影效果", "高对比度", "动态感"],
                creativity: 70,
                basedOnImage: false
            },
            3: {
                basic: "一个精致的机械手表，展示内部复杂结构",
                style: "写实风格",
                lensType: "标准镜头",
                compositionType: "对称构图",
                shotAngle: "眼平视角",
                depthOfField: "浅景深",
                details: ["精细纹理", "光影效果", "高对比度"],
                creativity: 30,
                basedOnImage: true
            }
        };
        
        // DOM元素
        const basicPrompt = document.getElementById('basicPrompt');
        const styleSelect = document.getElementById('styleSelect');
        const lensType = document.getElementById('lensType');
        const compositionType = document.getElementById('compositionType');
        const shotAngle = document.getElementById('shotAngle');
        const depthOfField = document.getElementById('depthOfField');
        const creativitySlider = document.getElementById('creativity');
        const generateBtn = document.getElementById('generateBtn');
        const outputPrompt = document.getElementById('outputPrompt');
        const copyBtn = document.getElementById('copyBtn');
        const saveBtn = document.getElementById('saveBtn');
        const basicCount = document.getElementById('basicCount');
        const outputCount = document.getElementById('outputCount');
        const advancedToggle = document.getElementById('advancedToggle');
        const advancedSettings = document.getElementById('advancedSettings');
        const creativityLevels = [
            document.getElementById('level1'),
            document.getElementById('level2'),
            document.getElementById('level3'),
            document.getElementById('level4'),
            document.getElementById('level5')
        ];
        const basedOnImage = document.getElementById('basedOnImage');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const historySection = document.getElementById('historySection');
        const historyList = document.getElementById('historyList');
        const notification = document.getElementById('notification');
        
        // 初始化历史记录
        let promptHistory = JSON.parse(localStorage.getItem('promptHistory')) || [];
        renderHistory();
        
        // 更新字数统计
        basicPrompt.addEventListener('input', () => {
            basicCount.textContent = basicPrompt.value.length;
        });
        
        // 进阶设置切换
        advancedToggle.addEventListener('click', () => {
            if (advancedSettings.style.display === 'block') {
                advancedSettings.style.display = 'none';
                advancedToggle.querySelector('i').className = 'fas fa-chevron-down';
            } else {
                advancedSettings.style.display = 'block';
                advancedToggle.querySelector('i').className = 'fas fa-chevron-up';
            }
        });
        
        // 进阶设置滑块
        document.getElementById('contrast').addEventListener('input', (e) => {
            document.getElementById('contrastValue').textContent = e.target.value + '%';
        });
        
        document.getElementById('saturation').addEventListener('input', (e) => {
            document.getElementById('saturationValue').textContent = e.target.value + '%';
        });
        
        document.getElementById('brightness').addEventListener('input', (e) => {
            document.getElementById('brightnessValue').textContent = e.target.value + '%';
        });
        
        // 创造力级别滑块
        creativitySlider.addEventListener('input', (e) => {
            updateCreativityIndicator(e.target.value);
        });
        
        function updateCreativityIndicator(value) {
            // 清除所有活动状态
            creativityLevels.forEach(level => {
                level.classList.remove('active');
            });
            
            // 根据值设置活动状态
            if (value < 20) {
                creativityLevels[0].classList.add('active');
            } else if (value < 40) {
                creativityLevels[1].classList.add('active');
            } else if (value < 60) {
                creativityLevels[2].classList.add('active');
            } else if (value < 80) {
                creativityLevels[3].classList.add('active');
            } else {
                creativityLevels[4].classList.add('active');
            }
        }
        
        // 加载示例
        function loadExample(id) {
            const example = examples[id];
            basicPrompt.value = example.basic;
            basicCount.textContent = example.basic.length;
            
            styleSelect.value = example.style;
            lensType.value = example.lensType;
            compositionType.value = example.compositionType;
            shotAngle.value = example.shotAngle;
            depthOfField.value = example.depthOfField;
            creativitySlider.value = example.creativity;
            basedOnImage.checked = example.basedOnImage;
            updateCreativityIndicator(example.creativity);
            
            // 清除所有复选框
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                if (checkbox.id !== 'basedOnImage') {
                    checkbox.checked = false;
                }
            });
            
            // 选中示例中的细节
            example.details.forEach(detail => {
                document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    if (checkbox.value === detail && checkbox.id !== 'basedOnImage') {
                        checkbox.checked = true;
                    }
                });
            });
            
            // 生成提示词
            generatePrompt();
            
            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // 生成提示词
        function generatePrompt() {
            // 显示加载指示器
            loadingIndicator.style.display = 'block';
            
            // 使用setTimeout模拟生成过程
            setTimeout(() => {
                let prompt = "";
                
                // 检查是否选择了"根据这个图"
                if (basedOnImage.checked) {
                    prompt += "根据这个图，";
                }
                
                prompt += basicPrompt.value;
                
                // 添加风格
                if (styleSelect.value) {
                    prompt += `, ${styleSelect.value}`;
                }
                
                // 添加镜头类型
                if (lensType.value) {
                    prompt += `, ${lensType.value}`;
                }
                
                // 修复：构图技巧的提示词生成错误，缺少闭合括号
                if (compositionType.value) {
                    prompt += `, ${compositionType.value}`;
                }
                
                // 添加拍摄角度
                if (shotAngle.value) {
                    prompt += `, ${shotAngle.value}`;
                }
                
                // 添加景深控制
                if (depthOfField.value) {
                    prompt += `, ${depthOfField.value}`;
                }
                
                // 添加细节
                document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                    if (checkbox.id !== 'basedOnImage') {
                        prompt += `, ${checkbox.value}`;
                    }
                });
                
                // 根据创造力级别添加提示词
                const creativity = creativitySlider.value;
                if (creativity > 80) {
                    prompt += ", 高度创意, 独特视角, 艺术性表现";
                } else if (creativity > 60) {
                    prompt += ", 创意发挥, 独特构图";
                } else if (creativity > 40) {
                    prompt += ", 适度创意, 平衡表现";
                } else if (creativity > 20) {
                    prompt += ", 轻微创意, 基本还原";
                } else {
                    prompt += ", 精准还原, 严格遵循提示";
                }
                
                // 添加质量提示词
                prompt += ", 高质量, 高细节, 8K分辨率";
                
                outputPrompt.textContent = prompt;
                outputCount.textContent = prompt.length;
                
                // 隐藏加载指示器
                loadingIndicator.style.display = 'none';
            }, 500);
        }
        
        // 保存到历史记录
        function saveToHistory() {
            const promptText = outputPrompt.textContent;
            if (promptText && promptText !== "生成的提示词将显示在这里...") {
                // 添加到历史记录数组
                promptHistory.unshift({
                    text: promptText,
                    timestamp: new Date().toLocaleString('zh-CN')
                });
                
                // 限制历史记录数量
                if (promptHistory.length > 10) {
                    promptHistory.pop();
                }
                
                // 保存到本地存储
                localStorage.setItem('promptHistory', JSON.stringify(promptHistory));
                
                // 更新历史记录显示
                renderHistory();
                
                // 显示历史记录区域
                historySection.style.display = 'block';
                
                // 显示通知
                showNotification('提示词已保存到历史记录');
            } else {
                showNotification('请先生成提示词');
            }
        }
        
        // 渲染历史记录
        function renderHistory() {
            historyList.innerHTML = '';
            
            if (promptHistory.length === 0) {
                historyList.innerHTML = '<p style="padding: 10px; color: #6c757d; text-align: center;">暂无历史记录</p>';
                return;
            }
            
            promptHistory.forEach((item, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <div style="font-weight: 500;">提示词 #${index + 1}</div>
                    <div style="font-size: 0.8rem; color: #6c757d;">${item.timestamp}</div>
                    <div style="font-size: 0.9rem; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.text}</div>
                `;
                
                historyItem.addEventListener('click', () => {
                    outputPrompt.textContent = item.text;
                    outputCount.textContent = item.text.length;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                
                historyList.appendChild(historyItem);
            });
        }
        
        // 显示通知
        function showNotification(message) {
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 2000);
        }
        
        // 复制提示词
        function copyToClipboard() {
            const text = outputPrompt.textContent;
            
            if (!text || text === "生成的提示词将显示在这里...") {
                showNotification('请先生成提示词');
                return;
            }
            
            // 使用现代剪贴板API
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(() => {
                    showNotification('提示词已复制到剪贴板');
                }).catch(err => {
                    console.error('复制失败: ', err);
                    fallbackCopyText(text);
                });
            } else {
                // 使用传统的execCommand方法作为备选
                fallbackCopyText(text);
            }
        }
        
        // 传统复制方法
        function fallbackCopyText(text) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            
            // 避免屏幕闪烁
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                showNotification('提示词已复制到剪贴板');
            } catch (err) {
                console.error('复制失败: ', err);
                showNotification('复制失败，请手动复制文本');
            }
            
            document.body.removeChild(textArea);
        }
        
        // 事件监听
        generateBtn.addEventListener('click', generatePrompt);
        copyBtn.addEventListener('click', copyToClipboard);
        saveBtn.addEventListener('click', saveToHistory);
        
        // 初始化
        updateCreativityIndicator(creativitySlider.value);
        
        // 初始化进阶设置滑块值
        document.getElementById('contrastValue').textContent = '50%';
        document.getElementById('saturationValue').textContent = '50%';
        document.getElementById('brightnessValue').textContent = '50%';
        
        // 如果有历史记录，显示历史记录区域
        if (promptHistory.length > 0) {
            historySection.style.display = 'block';
        }
        
        // 初始生成提示词
        generatePrompt();
    </script>
</body>
</html>
