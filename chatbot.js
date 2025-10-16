const $ = s => document.querySelector(s);

// Configuration - UPDATE THIS AFTER DEPLOYMENT
const API_BASE = 'https://blitz-backend-wdwl.onrender.com'; // Change to your Render URL in production

let conversationHistory = [];
let messageCount = 0;

// Simple markdown to HTML converter
function markdownToHTML(text) {
  if (!text) return '';
  
  let html = text;
  
  // Code blocks (``````)
  html = html.replace(/``````/g, '<pre><code>$1</code></pre>');
  
  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic (*text* or _text_)
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  
  // Lists (basic support)
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  return html;
}

// Scroll chat to bottom
function scrollToBottom() {
  const chatMessages = $('#chatMessages');
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Add message to chat
function addMessage(text, isUser = false) {
  const chatMessages = $('#chatMessages');
  if (!chatMessages) return;
  
  // Remove welcome message on first message
  const welcomeMsg = chatMessages.querySelector('.welcome-message');
  if (welcomeMsg) {
    welcomeMsg.remove();
  }
  
  // Hide suggested prompts after first message
  hideSuggestedPrompts();
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = isUser ? '👤' : '🤖';
  
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  
  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = isUser ? text : markdownToHTML(text);
  
  bubble.appendChild(content);
  
  // Add copy button for AI messages
  if (!isUser) {
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '📋 Copy';
    copyBtn.onclick = () => copyMessage(text, copyBtn);
    
    actions.appendChild(copyBtn);
    bubble.appendChild(actions);
  }
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(bubble);
  
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

// Copy message to clipboard
function copyMessage(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.textContent;
    button.textContent = '✅ Copied!';
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
    button.textContent = '❌ Failed';
    setTimeout(() => {
      button.textContent = '📋 Copy';
    }, 2000);
  });
}

// Show typing indicator
function showTyping() {
  const indicator = $('#typingIndicator');
  if (indicator) {
    indicator.classList.remove('hidden');
    scrollToBottom();
  }
  
  // Update status
  updateStatus('typing');
}

// Hide typing indicator
function hideTyping() {
  const indicator = $('#typingIndicator');
  if (indicator) {
    indicator.classList.add('hidden');
  }
  
  // Update status
  updateStatus('ready');
}

// Hide suggested prompts
function hideSuggestedPrompts() {
  const prompts = $('#suggestedPrompts');
  if (prompts) {
    prompts.style.display = 'none';
  }
}

// Show suggested prompts
function showSuggestedPrompts() {
  const prompts = $('#suggestedPrompts');
  if (prompts) {
    prompts.style.display = 'block';
  }
}

// Update status indicator
function updateStatus(status) {
  const statusIndicator = $('#statusIndicator');
  const statusText = $('#statusText');
  
  if (!statusIndicator || !statusText) return;
  
  switch(status) {
    case 'typing':
      statusIndicator.style.color = '#f59e0b';
      statusText.textContent = 'Typing...';
      break;
    case 'ready':
      statusIndicator.style.color = '#10b981';
      statusText.textContent = 'Ready';
      break;
    case 'error':
      statusIndicator.style.color = '#ef4444';
      statusText.textContent = 'Error';
      break;
  }
}

// Update stats
function updateStats() {
  $('#messageCount').textContent = messageCount;
  $('#conversationLength').textContent = Math.floor(conversationHistory.length / 2);
}

// Send message to AI
async function sendMessage(userMessage) {
  if (!userMessage.trim()) return;
  
  // Add user message to UI
  addMessage(userMessage, true);
  messageCount++;
  updateStats();
  
  // Add to conversation history
  conversationHistory.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });
  
  // Clear input
  const input = $('#chatInput');
  if (input) {
    input.value = '';
    input.style.height = 'auto';
  }
  
  // Show typing indicator
  showTyping();
  
  // Disable send button
  const sendBtn = $('#sendBtn');
  if (sendBtn) sendBtn.disabled = true;
  
  try {
    // Call backend API
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        history: conversationHistory
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Hide typing indicator
    hideTyping();
    
    // Add AI response to UI
    addMessage(data.reply, false);
    
    // Add to conversation history
    conversationHistory.push({
      role: 'model',
      parts: [{ text: data.reply }]
    });
    
    updateStats();
    
  } catch (error) {
    console.error('Chat error:', error);
    hideTyping();
    updateStatus('error');
    
    // Show error message
    addMessage(
      `❌ Sorry, I encountered an error: ${error.message}\n\nPlease make sure the backend is running and try again.`,
      false
    );
    
    setTimeout(() => updateStatus('ready'), 3000);
  } finally {
    // Re-enable send button
    if (sendBtn) sendBtn.disabled = false;
  }
}

// Clear conversation
function clearChat() {
  if (!confirm('Clear entire conversation? This cannot be undone.')) return;
  
  const chatMessages = $('#chatMessages');
  if (!chatMessages) return;
  
  // Clear messages
  chatMessages.innerHTML = `
    <div class="welcome-message">
      <div class="welcome-icon">🤖</div>
      <h3>Welcome to BLITZ AI Assistant!</h3>
      <p>I'm powered by Google Gemini 2.5 Flash. I can help you with:</p>
      <div class="capability-grid">
        <div class="capability-item">💡 Answering questions</div>
        <div class="capability-item">📝 Writing & editing</div>
        <div class="capability-item">💻 Coding assistance</div>
        <div class="capability-item">🧮 Math & calculations</div>
        <div class="capability-item">🌍 General knowledge</div>
        <div class="capability-item">🎨 Creative tasks</div>
      </div>
      <p class="welcome-cta">Try the suggested prompts below or type your own question!</p>
    </div>
  `;
  
  // Reset conversation
  conversationHistory = [];
  messageCount = 0;
  updateStats();
  
  // Show suggested prompts again
  showSuggestedPrompts();
  
  // Reset status
  updateStatus('ready');
}

// Auto-resize textarea
function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = $('#sendBtn');
  const chatInput = $('#chatInput');
  const clearChatBtn = $('#clearChatBtn');
  const promptChips = document.querySelectorAll('.prompt-chip');
  
  // Send button click
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const message = chatInput?.value;
      if (message) sendMessage(message);
    });
  }
  
  // Enter key to send (Shift+Enter for new line)
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const message = chatInput.value;
        if (message) sendMessage(message);
      }
    });
    
    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      autoResizeTextarea(chatInput);
    });
  }
  
  // Clear chat button
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', clearChat);
  }
  
  // Suggested prompt chips
  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt) {
        sendMessage(prompt);
      }
    });
  });
  
  // Initialize stats
  updateStats();
  updateStatus('ready');
  
  // Add route-ready class for page transitions
  document.documentElement.classList.add('route-ready');
});
