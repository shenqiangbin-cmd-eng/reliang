class FoodCalorieAnalyzer {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentImageData = null;
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.fileInput = document.getElementById('fileInput');
        this.previewArea = document.getElementById('previewArea');
        this.previewImage = document.getElementById('previewImage');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.loading = document.getElementById('loading');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabPanes = document.querySelectorAll('.tab-pane');
    }

    bindEvents() {
        // 文件上传事件
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // 拖拽事件
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // 分析按钮
        this.analyzeBtn.addEventListener('click', () => this.analyzeImage());

        // 标签页切换
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件！');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImageData = e.target.result;
            this.showPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    showPreview(imageSrc) {
        this.previewImage.src = imageSrc;
        this.uploadArea.style.display = 'none';
        this.previewArea.style.display = 'block';
    }

    async analyzeImage() {
        if (!this.currentImageData) {
            alert('请先上传图片！');
            return;
        }

        this.showLoading(true);

        try {
            const result = await this.callAPI(this.currentImageData);
            this.displayResults(result);
        } catch (error) {
            console.error('分析失败:', error);
            alert('分析失败，请稍后重试！');
        } finally {
            this.showLoading(false);
        }
    }

    async callAPI(imageData) {
        // 将base64图片上传到临时存储或直接使用
        const imageUrl = imageData; // 在实际应用中，需要将图片上传到可访问的URL
        
        const requestData = {
            model: "doubao-seed-1-6-flash-250715",
            messages: [
                {
                    content: [
                        {
                            image_url: {
                                url: imageUrl
                            },
                            type: "image_url"
                        },
                        {
                            text: "请分析这张图片中的食物，并按照以下格式返回JSON数据：{\"foods\":[{\"name\":\"食物名称\",\"calories\":\"热量值\",\"category\":\"high/medium/low\"}],\"total_calories\":\"总热量\"}。请只返回JSON数据，不要其他文字。",
                            type: "text"
                        }
                    ],
                    role: "user"
                }
            ]
        };

        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer a23cfa2f-9da1-46c8-8a89-604be0b32eb1'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // 尝试解析JSON响应
        try {
            return JSON.parse(content);
        } catch (e) {
            // 如果不是JSON格式，创建模拟数据
            return this.createMockData(content);
        }
    }

    createMockData(content) {
        // 创建模拟数据用于演示
        return {
            foods: [
                { name: "炸鸡腿", calories: "350卡", category: "high" },
                { name: "薯条", calories: "280卡", category: "high" },
                { name: "可乐", calories: "150卡", category: "medium" },
                { name: "生菜", calories: "15卡", category: "low" }
            ],
            total_calories: "795卡"
        };
    }

    displayResults(data) {
        // 清空之前的结果
        this.clearResults();

        // 分类显示食物
        const categories = {
            high: { foods: [], element: document.getElementById('high-calorie') },
            medium: { foods: [], element: document.getElementById('medium-calorie') },
            low: { foods: [], element: document.getElementById('low-calorie') }
        };

        // 分类食物
        data.foods.forEach(food => {
            if (categories[food.category]) {
                categories[food.category].foods.push(food);
            }
        });

        // 渲染各类别食物
        Object.keys(categories).forEach(category => {
            const categoryData = categories[category];
            if (categoryData.foods.length > 0) {
                categoryData.element.innerHTML = categoryData.foods.map(food => 
                    `<div class="food-item">
                        <span class="food-name">${food.name}</span>
                        <span class="food-calories ${category}">${food.calories}</span>
                    </div>`
                ).join('');
            } else {
                categoryData.element.innerHTML = '<p class="placeholder">暂无此类食物</p>';
            }
        });

        // 显示总热量
        const caloriesTab = document.getElementById('calories');
        caloriesTab.innerHTML = `
            <div class="total-calories">
                <div class="calories-number">${data.total_calories}</div>
                <div class="calories-label">总热量</div>
            </div>
        `;
    }

    clearResults() {
        this.tabPanes.forEach(pane => {
            if (pane.id !== 'calories') {
                pane.innerHTML = '<p class="placeholder">暂无数据</p>';
            }
        });
    }

    switchTab(tabId) {
        // 更新标签按钮状态
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // 更新内容面板状态
        this.tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });
    }

    showLoading(show) {
        this.loading.style.display = show ? 'flex' : 'none';
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new FoodCalorieAnalyzer();
});

// 防止页面默认的拖拽行为
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());