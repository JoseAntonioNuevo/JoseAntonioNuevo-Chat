(function() {
  'use strict';

  // Web Component class definition
  class JaChatbot extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.sessionId = this.generateSessionId();
      this.messages = [];
      this.isOpen = false;
      this.isLoading = false;
      this.tenant = this.getAttribute('tenant') || 'default';
      this.apiUrl = this.getAttribute('api-url') || 'http://localhost:3000/api/chat';
    }

    generateSessionId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    connectedCallback() {
      this.render();
      this.attachEventListeners();
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            --primary-color: #1976d2;
            --bg-color: #ffffff;
            --text-color: #333333;
            --border-color: #dddddd;
            --user-msg-bg: #e3f2fd;
            --assistant-msg-bg: #f5f5f5;
            
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: system-ui, -apple-system, sans-serif;
          }

          .chat-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: var(--primary-color);
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: transform 0.3s ease;
          }

          .chat-button:hover {
            transform: scale(1.05);
          }

          .chat-button svg {
            width: 30px;
            height: 30px;
          }

          .chat-container {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 380px;
            max-width: 90vw;
            height: 600px;
            max-height: 80vh;
            background: var(--bg-color);
            border-radius: 12px;
            box-shadow: 0 5px 25px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: translateY(20px);
            pointer-events: none;
            transition: opacity 0.3s ease, transform 0.3s ease;
          }

          .chat-container.open {
            opacity: 1;
            transform: translateY(0);
            pointer-events: all;
          }

          .chat-header {
            padding: 16px;
            background: var(--primary-color);
            color: white;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .chat-title {
            font-weight: 600;
            font-size: 16px;
          }

          .close-button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .close-button:hover {
            opacity: 0.8;
          }

          .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .message {
            padding: 10px 14px;
            border-radius: 8px;
            max-width: 80%;
            word-wrap: break-word;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from { 
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .message.user {
            background: var(--user-msg-bg);
            align-self: flex-end;
            margin-left: auto;
          }

          .message.assistant {
            background: var(--assistant-msg-bg);
            align-self: flex-start;
          }

          .message.loading {
            background: var(--assistant-msg-bg);
            align-self: flex-start;
            display: flex;
            gap: 4px;
            padding: 14px;
          }

          .loading-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--primary-color);
            animation: bounce 1.4s infinite ease-in-out;
          }

          .loading-dot:nth-child(1) {
            animation-delay: -0.32s;
          }

          .loading-dot:nth-child(2) {
            animation-delay: -0.16s;
          }

          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }

          .chat-input-container {
            padding: 16px;
            border-top: 1px solid var(--border-color);
            display: flex;
            gap: 8px;
          }

          .chat-input {
            flex: 1;
            padding: 10px 14px;
            border: 1px solid var(--border-color);
            border-radius: 24px;
            outline: none;
            font-size: 14px;
            font-family: inherit;
          }

          .chat-input:focus {
            border-color: var(--primary-color);
          }

          .send-button {
            padding: 10px 16px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 24px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s ease;
          }

          .send-button:hover:not(:disabled) {
            background: #1565c0;
          }

          .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .empty-state {
            text-align: center;
            color: #999;
            padding: 32px;
            font-size: 14px;
          }
        </style>

        <button class="chat-button" id="toggleButton">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L1 23l6.71-1.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-2 13l-2-2 1.41-1.41L11 13.17l3.59-3.58L16 11l-5 5z"/>
          </svg>
        </button>

        <div class="chat-container" id="chatContainer">
          <div class="chat-header">
            <span class="chat-title">AI Assistant</span>
            <button class="close-button" id="closeButton">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M14.95 5.05a.75.75 0 00-1.06 0L10 8.94 6.11 5.05a.75.75 0 10-1.06 1.06L8.94 10l-3.89 3.89a.75.75 0 101.06 1.06L10 11.06l3.89 3.89a.75.75 0 101.06-1.06L11.06 10l3.89-3.89a.75.75 0 000-1.06z"/>
              </svg>
            </button>
          </div>
          
          <div class="chat-messages" id="messagesContainer">
            <div class="empty-state">
              Start a conversation with the AI assistant
            </div>
          </div>

          <div class="chat-input-container">
            <input 
              type="text" 
              class="chat-input" 
              id="messageInput"
              placeholder="Type your message..."
              disabled
            />
            <button class="send-button" id="sendButton" disabled>
              Send
            </button>
          </div>
        </div>
      `;
    }

    attachEventListeners() {
      const toggleButton = this.shadowRoot.getElementById('toggleButton');
      const closeButton = this.shadowRoot.getElementById('closeButton');
      const sendButton = this.shadowRoot.getElementById('sendButton');
      const messageInput = this.shadowRoot.getElementById('messageInput');
      const chatContainer = this.shadowRoot.getElementById('chatContainer');

      toggleButton.addEventListener('click', () => {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
          chatContainer.classList.add('open');
          messageInput.disabled = false;
          sendButton.disabled = false;
          messageInput.focus();
        } else {
          chatContainer.classList.remove('open');
        }
      });

      closeButton.addEventListener('click', () => {
        this.isOpen = false;
        chatContainer.classList.remove('open');
      });

      sendButton.addEventListener('click', () => this.sendMessage());
      
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !this.isLoading) {
          this.sendMessage();
        }
      });
    }

    async sendMessage() {
      const messageInput = this.shadowRoot.getElementById('messageInput');
      const sendButton = this.shadowRoot.getElementById('sendButton');
      const message = messageInput.value.trim();
      
      if (!message || this.isLoading) return;

      // Add user message
      this.addMessage('user', message);
      this.messages.push({ role: 'user', content: message });
      
      // Clear input and disable while loading
      messageInput.value = '';
      messageInput.disabled = true;
      sendButton.disabled = true;
      this.isLoading = true;

      // Show loading indicator
      this.showLoadingIndicator();

      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Stream-Protocol': 'text',
          },
          body: JSON.stringify({
            messages: this.messages,
            tenant: this.tenant,
            sessionId: this.sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Remove loading indicator
        this.removeLoadingIndicator();

        // Process streaming response (text protocol)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';
        let messageElement = null;
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          // For text streaming, append directly
          if (buffer) {
            assistantMessage += buffer;
            buffer = '';
            if (!messageElement) {
              messageElement = this.addMessage('assistant', assistantMessage);
            } else {
              messageElement.textContent = assistantMessage;
            }
          }
        }

        // Add the complete message to history
        if (assistantMessage) {
          this.messages.push({ role: 'assistant', content: assistantMessage });
        }

      } catch (error) {
        console.error('Chat error:', error);
        this.removeLoadingIndicator();
        this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
      } finally {
        this.isLoading = false;
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
      }
    }

    addMessage(role, content) {
      const messagesContainer = this.shadowRoot.getElementById('messagesContainer');
      
      // Remove empty state if it exists
      const emptyState = messagesContainer.querySelector('.empty-state');
      if (emptyState) {
        emptyState.remove();
      }

      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${role}`;
      messageDiv.textContent = content;
      messagesContainer.appendChild(messageDiv);
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      return messageDiv;
    }

    showLoadingIndicator() {
      const messagesContainer = this.shadowRoot.getElementById('messagesContainer');
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'message loading';
      loadingDiv.id = 'loadingIndicator';
      loadingDiv.innerHTML = `
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      `;
      messagesContainer.appendChild(loadingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    removeLoadingIndicator() {
      const loadingIndicator = this.shadowRoot.getElementById('loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.remove();
      }
    }
  }

  // Register the custom element
  if (!customElements.get('ja-chatbot')) {
    customElements.define('ja-chatbot', JaChatbot);
  }
})();
