const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const axios = require('axios')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

app.use(express.json())

io.on('connection', (socket) => {
    console.log('New client connected')

    // 监听语音消息事件
    socket.on('sendMessage', async (message) => {
        const aiReply = await getAiResponse(message.text)
        socket.emit('receiveMessage', { text: aiReply })
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected')
    })
})

async function getAiResponse(message) {
    const response = await axios.post(
        'https://api.openai.com/v1/engines/davinci-codex/completions',
        {
            prompt: message,
            max_tokens: 50,
        },
        {
            headers: { Authorization: `Bearer YOUR_API_KEY` },
        }
    )
    return response.data.choices[0].text.trim()
}

server.listen(3000, () => console.log('Server listening on port 3000'))
