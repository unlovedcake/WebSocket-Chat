
npm init -y

npm install file-type@16

npm install express ws mysql2 bcryptjs jsonwebtoken multer dotenv



#To automatically restart your server during development when files change, you can use nodemon
npm install --save-dev nodemon





#Guide For Security Best Practices 


In client-side applications, such as a Flutter app, you generally don't need to manually implement security-related headers like X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc., in the client-side code. These headers are typically configured on the server-side to enhance security for the entire website or API. Here's an explanation of how these headers work and when you need them:

Server-Side Headers (Client-Side Effects)

1. Content-Type: text/html; charset=utf-8

Server-side: This tells the browser or client how to interpret the response (HTML with UTF-8 encoding).
Client-side (Flutter): In Flutter, if you're making API requests, you typically set the Content-Type in the request header when sending data (like application/json for sending JSON). You don't need to worry about it when receiving data, as it's controlled by the server.

X-Content-Type-Options: nosniff

Server-side: Prevents browsers from trying to guess the content type. This helps avoid attacks like MIME sniffing.
Client-side (Flutter): This is a browser feature, not something you need to explicitly manage in Flutter, as it’s handled automatically by the browser or webview. For API calls, the client-side Flutter app just receives the response as per the Content-Type.


2. X-Frame-Options: DENY

Server-side: This header prevents the web page from being embedded in an iframe, which is a security feature to prevent clickjacking.
Client-side (Flutter): In Flutter apps, you typically aren't concerned about this unless you use a web view to display content. If you're using a webview, the app may respect this header if the webpage you're loading is configured to use it.


3. Strict-Transport-Security (HSTS)

Server-side: This header tells the browser to always connect via HTTPS and never HTTP. It ensures secure communication between the client and the server.
Client-side (Flutter): In Flutter, when making network requests, you should always ensure that you are connecting to an HTTPS endpoint. If the server includes this header, it will instruct the client (like browsers) to enforce HTTPS connections. However, you don't need to explicitly handle this in your Flutter code; just ensure that your API endpoints are served over HTTPS.

4. X-XSS-Protection: 1; mode=block

Server-side: This header tells the browser to block pages that detect reflected cross-site scripting (XSS) attacks.
Client-side (Flutter): Flutter applications don't run in a web browser and aren't typically vulnerable to this type of attack. However, if your Flutter app is using a web view, this header can be beneficial for web content.

5.Content-Security-Policy (CSP)

Server-side: This header helps prevent various attacks like XSS by specifying which resources can be loaded by the browser.
Client-side (Flutter): You don't need to manage this directly in Flutter. However, if your Flutter app uses a web view, the CSP header might apply to the content loaded within that web view.


6. Referrer-Policy: strict-origin-when-cross-origin

Server-side: Controls the information sent in the Referer header when making requests to other domains.
Client-side (Flutter): This is mainly relevant when working with web browsers or web views. For native Flutter apps, this header doesn't directly affect the app unless you're dealing with web views.




CREATE TABLE pinned_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    is_pinned BOOLEAN DEFAULT TRUE,
    pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (pinned_by) REFERENCES users(id) ON DELETE CASCADE
);


INSERT INTO pinned_messages (conversation_id, message_id, pinned_by, is_pinned)
VALUES (7, 118422, 2, TRUE);


Get message with pin comment
SELECT messages.*, 
         users.name AS sender_name, 
         users.image_url AS sender_profile,
       	 reactions.reaction_type AS reaction_type,
       COALESCE(pm.is_pinned, FALSE) AS is_pinned
FROM messages 
LEFT JOIN pinned_messages pm ON messages.id = pm.message_id AND pm.conversation_id = messages.conversation_id
LEFT JOIN reactions ON messages.id =  reactions.message_id
JOIN users ON messages.sender_id =  users.id
WHERE messages.conversation_id = 7
ORDER BY messages.created_at ASC



Get all pin messages for specific user

SELECT messages.*, 
         users.name AS sender_name, 
         users.image_url AS sender_profile,
       	 reactions.reaction_type AS reaction_type,
       COALESCE(pm.is_pinned, FALSE) AS is_pinned
FROM messages 
LEFT JOIN pinned_messages pm ON messages.id = pm.message_id AND pm.conversation_id = 7 AND pm.is_pinned = 1
LEFT JOIN reactions ON messages.id =  reactions.message_id
JOIN users ON messages.sender_id =  users.id
WHERE messages.conversation_id = 7 AND pm.is_pinned = TRUE
ORDER BY messages.created_at ASC;