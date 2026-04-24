import { useState } from 'react';
import axios from 'axios';

function Chatbot({ token }) {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!message) return;

    try {
      const res = await axios.post(
        'http://localhost:5000/api/chatbot/chat',
        { message },
        {
          headers: { Authorization: token }
        }
      );

      setChat([...chat, { user: message, bot: res.data.reply }]);
      setMessage('');
    } catch (err) {
      alert('Login required to use chatbot');
    }
  };

  return (
    <div className="chatbox">
      <h3>🤖 AI Medicine Assistant</h3>

      <div className="chat-messages">
        {chat.map((c, i) => (
          <div key={i}>
            <p><strong>You:</strong> {c.user}</p>
            <p><strong>AI:</strong> {c.bot}</p>
          </div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask about medicines..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chatbot;