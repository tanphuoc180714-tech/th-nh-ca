document.addEventListener('DOMContentLoaded', () => {
    // ---- INDEX PAGE LOGIC ----
    const hymnsContainer = document.getElementById('hymns-container');
    if (hymnsContainer) {
        fetch('data/hymns.json')
            .then(res => res.json())
            .then(data => {
                hymnsContainer.innerHTML = '';
                data.forEach(hymn => {
                    const card = document.createElement('div');
                    card.className = 'hymn-card';
                    card.onclick = () => window.location.href = `study.html?id=${hymn.id}`;
                    
                    const lyricsPreview = hymn.lyrics.substring(0, 100) + '...';
                    
                    card.innerHTML = `
                        <h4>${hymn.title}</h4>
                        <p>${lyricsPreview}</p>
                    `;
                    hymnsContainer.appendChild(card);
                });
            })
            .catch(err => {
                hymnsContainer.innerHTML = '<p style="color:red">Lỗi tải dữ liệu. Hãy đảm bảo bạn đang chạy trên server.</p>';
            });
    }

    // ---- STUDY PAGE LOGIC ----
    const hymnTitle = document.getElementById('hymn-title');
    const hymnLyrics = document.getElementById('hymn-lyrics');
    let currentHymn = null;

    if (hymnTitle && hymnLyrics) {
        const urlParams = new URLSearchParams(window.location.search);
        const hymnId = urlParams.get('id');

        if (!hymnId) {
            window.location.href = 'index.html';
        }

        fetch('data/hymns.json')
            .then(res => res.json())
            .then(data => {
                currentHymn = data.find(h => h.id === hymnId);
                if (currentHymn) {
                    hymnTitle.textContent = currentHymn.title;
                    hymnLyrics.textContent = currentHymn.lyrics;
                } else {
                    hymnTitle.textContent = "Không tìm thấy Thánh ca";
                }
            });

        // Tab Switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const targetId = `tab-${btn.getAttribute('data-tab')}`;
                document.getElementById(targetId).classList.add('active');
            });
        });

        // --- AI QUIZ ---
        let currentQuiz = [];
        const btnGenQuiz = document.getElementById('btn-generate-quiz');
        const quizContainer = document.getElementById('quiz-container');
        
        btnGenQuiz.addEventListener('click', async () => {
            if(!currentHymn) return;
            
            btnGenQuiz.innerHTML = '⏳ Đang tạo (Vui lòng chờ)...';
            btnGenQuiz.disabled = true;
            
            try {
                const res = await fetch('/api/generate-quiz', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ passage: currentHymn.lyrics })
                });
                const data = await res.json();
                
                if(data.questions) {
                    currentQuiz = data.questions;
                    renderQuiz(currentQuiz);
                    btnGenQuiz.parentElement.style.display = 'none'; // Hide intro
                    quizContainer.style.display = 'block';
                } else {
                    alert('Lỗi: ' + data.error);
                }
            } catch(e) {
                alert('Lỗi kết nối: ' + e.message);
            } finally {
                btnGenQuiz.innerHTML = '✨ Tạo Bộ Câu Hỏi';
                btnGenQuiz.disabled = false;
            }
        });

        function renderQuiz(questions) {
            quizContainer.innerHTML = '';
            questions.forEach((q, qIndex) => {
                const block = document.createElement('div');
                block.className = 'question-block';
                
                let optionsHtml = '';
                q.options.forEach((opt, optIndex) => {
                    optionsHtml += `
                        <label class="option-label" id="label-q${qIndex}-opt${optIndex}">
                            <input type="radio" name="q${qIndex}" value="${optIndex}">
                            ${opt}
                        </label>
                    `;
                });

                block.innerHTML = `
                    <h4>Câu ${qIndex + 1}: ${q.question}</h4>
                    <div class="options-group">${optionsHtml}</div>
                `;
                quizContainer.appendChild(block);
            });
            
            const submitBtn = document.createElement('button');
            submitBtn.className = 'btn btn-success';
            submitBtn.textContent = 'Nộp Bài';
            submitBtn.style.marginTop = '15px';
            submitBtn.onclick = checkQuiz;
            quizContainer.appendChild(submitBtn);
        }

        function checkQuiz() {
            let score = 0;
            currentQuiz.forEach((q, qIndex) => {
                const selected = document.querySelector(`input[name="q${qIndex}"]:checked`);
                const correctIdx = q.correct;
                
                // Reset colors
                q.options.forEach((_, optIdx) => {
                    document.getElementById(`label-q${qIndex}-opt${optIdx}`).className = 'option-label';
                });

                if (selected) {
                    const selectedVal = parseInt(selected.value);
                    if (selectedVal === correctIdx) {
                        score++;
                        document.getElementById(`label-q${qIndex}-opt${selectedVal}`).classList.add('correct');
                    } else {
                        document.getElementById(`label-q${qIndex}-opt${selectedVal}`).classList.add('wrong');
                        document.getElementById(`label-q${qIndex}-opt${correctIdx}`).classList.add('correct');
                    }
                } else {
                    // Missed
                    document.getElementById(`label-q${qIndex}-opt${correctIdx}`).classList.add('correct');
                }
            });

            const resultBox = document.getElementById('quiz-result');
            resultBox.style.display = 'block';
            resultBox.innerHTML = `<div class="score-badge">${score} / ${currentQuiz.length}</div><p style="text-align:center">Bạn đã hoàn thành bài tập trắc nghiệm!</p>`;
        }

        // --- AI ESSAY ---
        const btnGenEssay = document.getElementById('btn-generate-essay');
        const essayContainer = document.getElementById('essay-container');
        const aiEssayQuestion = document.getElementById('ai-essay-question');
        const btnSubmitEssay = document.getElementById('btn-submit-essay');
        const essayResult = document.getElementById('essay-result');
        let currentEssayQuestion = '';

        btnGenEssay.addEventListener('click', async () => {
            if(!currentHymn) return;
            
            btnGenEssay.innerHTML = '⏳ Đang suy nghĩ...';
            btnGenEssay.disabled = true;
            
            try {
                const res = await fetch('/api/generate-essay-question', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ passage: currentHymn.lyrics })
                });
                const data = await res.json();
                
                if(data.question) {
                    currentEssayQuestion = data.question;
                    aiEssayQuestion.textContent = currentEssayQuestion;
                    btnGenEssay.parentElement.style.display = 'none';
                    essayContainer.style.display = 'block';
                } else {
                    alert('Lỗi: ' + data.error);
                }
            } catch(e) {
                alert('Lỗi kết nối: ' + e.message);
            } finally {
                btnGenEssay.innerHTML = '✨ Tạo Câu Hỏi Suy Ngẫm';
                btnGenEssay.disabled = false;
            }
        });

        btnSubmitEssay.addEventListener('click', async () => {
            const answer = document.getElementById('essay-answer').value.trim();
            if(!answer) return alert('Vui lòng viết câu trả lời của bạn!');

            btnSubmitEssay.innerHTML = '⏳ Đang chấm điểm...';
            btnSubmitEssay.disabled = true;
            
            try {
                const res = await fetch('/api/grade-essay', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ 
                        passage: currentHymn.lyrics,
                        question: currentEssayQuestion,
                        answer: answer
                    })
                });
                const data = await res.json();
                
                if(data.score !== undefined) {
                    essayResult.style.display = 'block';
                    document.getElementById('essay-score').textContent = `${data.score}/10`;
                    
                    // Render markdown using marked.js if available
                    let feedbackHtml = data.feedback;
                    if(typeof marked !== 'undefined') {
                        feedbackHtml = marked.parse(data.feedback);
                    }
                    
                    document.getElementById('essay-feedback').innerHTML = feedbackHtml;
                } else {
                    alert('Lỗi: ' + data.error);
                }
            } catch(e) {
                alert('Lỗi kết nối: ' + e.message);
            } finally {
                btnSubmitEssay.innerHTML = 'Gửi Bài & Chấm Điểm';
                btnSubmitEssay.disabled = false;
            }
        });
    }
});
