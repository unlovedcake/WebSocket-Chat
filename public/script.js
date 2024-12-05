const ws = new WebSocket(`ws://${window.location.host}`);
const imageInput = document.getElementById('image');
const messagesDiv = document.getElementById('messages');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');

const chatContainer = document.getElementById("chat-container");

// Fetch chat history
fetch('/messages')
  .then((response) => response.json())
  .then((messages) => {
    renderMessages(messages);
    // messages.forEach((msg) => {
    //     renderMessages(messages);
    //   //addMessage(msg.username, msg.message, msg.created_at, msg.image_url);
    // });
  });


  function renderMessages(messages) {
    messages.forEach(message => {
      // Create a message element
      const messageDiv = document.createElement("div");
      messageDiv.className = "message";

      // Add image
      const img = document.createElement("img");
      img.src = message.image_url;
      img.alt = 'Alt image';

      // Create a div for message details
      const detailsDiv = document.createElement("div");
      detailsDiv.className = "message-details";

      // Add name
      const name = document.createElement("div");
      name.className = "message-name";
      name.textContent = message.username;

      // Add text
      const text = document.createElement("div");
      text.className = "message-text";
      text.textContent = message.message;

      // Add timestamp
      const time = document.createElement("div");
      time.className = "message-time";
      time.textContent = message.created_at;

      // Append all parts to the message details
      detailsDiv.appendChild(name);
      detailsDiv.appendChild(text);
      detailsDiv.appendChild(time);

      // Append image and details to the message div
      messageDiv.appendChild(img);
      messageDiv.appendChild(detailsDiv);

      // Append message div to the chat container
      chatContainer.appendChild(messageDiv);
    });
  }

// Add message to the chat window
function addMessage(username, message,  time,image) {

    const imageContainer = document.getElementById('image-container');

// Create an image element
const img = document.createElement('img');

img.src = image; // Replace with your image URL
img.alt = 'Placeholder Image';

img.width = 150;
img.height = 150;

// Append the image to the container
imageContainer.appendChild(img);

    
  const messageElem = document.createElement('div');
  messageElem.textContent = `[${new Date(time).toLocaleTimeString()}] ${username}: ${message}`;
  messagesDiv.appendChild(messageElem);
}

// Send message via WebSocket
sendButton.addEventListener('click', () => {
    
  const username = usernameInput.value;
  const message = messageInput.value;
  const imageFile = imageInput.files[0];

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Image = reader.result.split(',')[1];
      ws.send(JSON.stringify({ username,message, image: base64Image }));
      imageInput.value = ''; // Clear the input
    };
    reader.readAsDataURL(imageFile);
  }

  else if (username && message) {
    ws.send(JSON.stringify({ username, message }));
    messageInput.value = '';
  }
});

// Handle incoming WebSocket messages

// Handle incoming WebSocket messages
ws.onmessage = (event) => {
    const { username, message, image_url, created_at } = JSON.parse(event.data);
  
    const messageElem = document.createElement('div');
    messageElem.textContent = `[${new Date(created_at).toLocaleTimeString()}] ${username}: ${message || ''}`;
    messagesDiv.appendChild(messageElem);
  
    if (image_url) {
      const imgElem = document.createElement('img');
      imgElem.src = image_url;
      imgElem.alt = 'Sent image';
      imgElem.style.maxWidth = '200px';
      messagesDiv.appendChild(imgElem);
    }
    
  };
// ws.onmessage = (event) => {
//   const { username, message, created_at } = JSON.parse(event.data);
//   addMessage(username, message, created_at);
// };
