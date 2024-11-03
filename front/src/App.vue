<template>
    <div class="chat-container">
        <div class="chat-messages">
            <div v-for="message in messages" :key="message.id">
                <strong>{{ message.sender }}:</strong> {{ message.text }}
            </div>
        </div>
        <button @click="startRecording">🎤 Start Speaking</button>
        <button @click="stopRecording" :disabled="!isRecording">🛑 Stop</button>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'

// 定义消息类型
interface Message {
    id: number
    sender: string
    text: string
}

// 初始化Socket客户端
const socket: Socket = io('http://localhost:3000')

// 定义状态
const messages = ref<Message[]>([])
const isRecording = ref(false)
const recognition = ref<SpeechRecognition | null>(null)
const speechSynthesis = window.speechSynthesis

// 检测语言（简单示例，实际应用中可使用更高级的语言检测工具）
const detectLanguage = (text: string) => {
    const chinesePattern = /[\u4e00-\u9fa5]/
    return chinesePattern.test(text) ? 'zh-CN' : 'en-US'
}

// 启动语音识别（支持中英文）
const startRecording = () => {
    recognition.value = new (window as any).webkitSpeechRecognition()
    recognition.value.lang = 'zh-CN' // 默认语言为中文
    recognition.value.continuous = true
    recognition.value.interimResults = false

    recognition.value.onresult = (event: SpeechRecognitionEvent) => {
        const lastResult = event.results[event.results.length - 1]
        if (lastResult.isFinal) {
            const text = lastResult[0].transcript
            sendMessage(text)
        }
    }

    recognition.value.start()
    isRecording.value = true
}

// 停止语音识别
const stopRecording = () => {
    if (recognition.value) {
        recognition.value.stop()
        isRecording.value = false
    }
}

// 发送消息到后端
const sendMessage = (text: string) => {
    socket.emit('sendMessage', { text })
    messages.value.push({ id: Date.now(), sender: 'You', text })
}

// 接收来自AI的消息
const receiveMessage = (text: string) => {
    messages.value.push({ id: Date.now(), sender: 'AI', text })
    speakText(text)
}

// 将AI的回复转为语音（自动检测语言）
const speakText = (text: string) => {
    const lang = detectLanguage(text) // 自动检测语言
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    speechSynthesis.speak(utterance)
}

// 生命周期钩子
onMounted(() => {
    socket.on('receiveMessage', (data: { text: string }) => {
        receiveMessage(data.text)
    })
})

onUnmounted(() => {
    socket.off('receiveMessage')
})
</script>

<style scoped>
.chat-container {
    width: 300px;
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.chat-messages {
    width: 100%;
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #ccc;
    padding: 10px;
    margin-bottom: 10px;
}
</style>
