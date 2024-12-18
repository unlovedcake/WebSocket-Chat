
const db = require('../database');


const isUserTyping = async (data, ws,wss) => {

    const { isTyping,sender_name} = JSON.parse(data);

      // Broadcast typing event
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify({
            type: "TYPING",
            isTyping: isTyping,
            sender_name: sender_name,
           
          }));
        }
      });

}

const checkIfUserIsOnline = async (userId) => {

  const query = `SELECT is_online FROM users WHERE id = ?`;
  const [rows] = await db.query(query,[userId]);

  
  if (rows.length > 0) {
    isOnline = results[0].is_online === 1;
  } 

}


const sendMessage = async (data, ws,wss,mediaUrl) => {

    const { isTyping,conversation_id, sender_id,receiver_id,text,media_type,sender_name,sender_profile} = JSON.parse(data);

    const id = Math.floor(100000 + Math.random() * 900000);
    let isOnline = false;



    const connection = await db.getConnection();
    
          try {

            await connection.beginTransaction(); // Start the transaction

            
              const query = `SELECT is_online FROM users WHERE id = ?`;
              const [rows] =  await connection.query(query,[receiver_id]);
  
              if (rows.length > 0) {
                isOnline = rows[0].is_online === 1;
                console.log('Is Online:  ' + isOnline);
              } 


              await connection.query(
              'INSERT INTO messages (id,conversation_id, sender_id, receiver_id, text, media_url,media_type,status) VALUES (?,?,?,?, ?, ?,?,?)',
              [id,conversation_id,sender_id,receiver_id, text || '', mediaUrl || '',media_type,isOnline ? 'read' : 'sent']
            );
            await connection.commit();
           
            wss.clients.forEach((client) => {
              if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify({
                  type: "NEW_MESSAGE",
                  id:id,
                  isTyping: isTyping,
                  receiver_id:receiver_id,
                  sender_id:sender_id,     
                  sender_name: sender_name,
                  sender_profile:sender_profile,
                  text: text,
                  media_url: mediaUrl,
                  status:isOnline ? 'read' : 'sent',
                  created_at: new Date(),
                }));
              }
            });

           
      
            
          } catch (dbError) {
            await connection.rollback();
    
            ws.send(
              JSON.stringify({
                hasError: true,
                status: "error",
                error_log: dbError,
                message: 'Failed to save message to the database', 
              })
            );
            
          }finally {
            connection.release(); // Release the connection back to the pool
        }
        
}

const getAllPinned = async (data, ws,wss) => {
      
      const { conversation_id,user_id} = JSON.parse(data);
      const id = Math.floor(100000 + Math.random() * 900000);

      
      try {
     
        const query = ` SELECT messages.*, 
        users.name AS sender_name, 
        users.image_url AS sender_profile,
        reactions.reaction_type AS reaction_type,
        COALESCE(pm.is_pinned, FALSE) AS is_pinned
        FROM messages 
        LEFT JOIN pinned_messages pm ON messages.id = pm.message_id AND pm.conversation_id = messages.conversation_id
        LEFT JOIN reactions ON messages.id =  reactions.message_id
        JOIN users ON messages.sender_id =  users.id AND pm.user_id =  ?
        WHERE messages.conversation_id = ?  AND pm.is_pinned = TRUE
        ORDER BY messages.created_at ASC;`;
        const [rows] = await db.query(query,[user_id,conversation_id]);

        console.log('Get All Pinned' + rows);
    
        if(rows.length > 0){
          wss.clients.forEach((client) => {
            if (client.readyState === ws.OPEN) {
              client.send(JSON.stringify({
                type: 'GETALLPINNED', conversation_id: conversation_id, user_id: user_id, data:rows
             
              }));
            }
          });
        }else{
          ws.send(JSON.stringify({ type: 'GETALLPINNED',message: 'You dont have yet pinned message.', status: 'empty' }));
        }
       
        } catch (dbError) {
          ws.send(
            JSON.stringify({
              hasError: true,
              status: "error",
              error_log: dbError,
              message: 'Failed to get pinned messages to the database', 
            }));
        }


    }

    const addPin = async (data,ws,wss) => {
      
        const { conversation_id,message_id,user_id,is_pinned} = JSON.parse(data);
        const id = Math.floor(100000 + Math.random() * 900000);
  
        
        try {
       
          const query = `
          INSERT INTO pinned_messages (id,conversation_id, message_id,user_id, is_pinned)
           VALUES (?,?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE is_pinned = VALUES(is_pinned);
         `;
             await db.query(query,[id,conversation_id,message_id,user_id,is_pinned]);
  
  
             wss.clients.forEach((client) => {
              if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify({
                  type: 'PIN', conversation_id: conversation_id, message_id: message_id,user_id: user_id,is_pinned:is_pinned
               
                }));
              }
            });
          
          
         
          } catch (dbError) {
            ws.send(
              JSON.stringify({
                hasError: true,
                status: "error",
                error_log: dbError,
                message: 'Failed to save pin message to the database', 
              })
            );
           
          }
      }

      const addReactionToMessage = async (data,ws,wss) => {

        try {
  
            const { message_id,user_id,reaction_type} = JSON.parse(data);
   
            const query = `
            INSERT INTO reactions (message_id, user_id, reaction_type) 
            VALUES ( ?, ?, ?)
            ON DUPLICATE KEY UPDATE reaction_type = VALUES(reaction_type);
            `;
           
          const [rows] = await db.query(query,[message_id,user_id,reaction_type]);
  
          console.log('Reactions' + rows);
            
            wss.clients.forEach((client) => {
              if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify({
                  type: "REACTION",
                  reaction_type:reaction_type,
                  message_id:message_id,
                  user_id:user_id
               
                }));
              }
            });
            } catch (dbError) {
              ws.send(
                JSON.stringify({
                  hasError: true,
                  status: "error",
                  error_log: dbError,
                  message: 'Failed to save reaction to the database', 
                })
              );
            }
      }

    module.exports = { getAllPinned,sendMessage,addPin,addReactionToMessage,isUserTyping };