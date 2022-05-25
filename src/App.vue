<template>

  <n-layout>
    <n-layout-header bordered
                     style="min-height: 30px;"
                     class="t">
      <n-space justify="space-between">
        <n-gradient-text gradient="linear-gradient(90deg, red 0%, green 50%, blue 100%)"
                         :size="20">
          我的世界聊天器 by-枫叶秋林
        </n-gradient-text>
        <n-space justify="end"
                 class="nt">
          <n-button type="success"
                    @click="showModal = true"
                    :disabled="setupdisabled">
            设置
          </n-button>
          <n-modal v-model:show="showModal"
                   class="custom-card"
                   preset="card"
                   style="width: '600px'"
                   title="设置"
                   size="huge"
                   :bordered="false"
                   :segmented="segmented">
            <n-form ref="formRef"
                    :model="formValue"
                    :rules="rules"
                    label-placement="left">
              <n-form-item label="通信地址"
                           path="ws">
                <n-input v-model:value="formValue.ws"
                         placeholder="通信地址" />
              </n-form-item>
              <n-form-item label="服务器地址"
                           path="host">
                <n-input v-model:value="formValue.host"
                         placeholder="请输入地址" />
              </n-form-item>
              <n-form-item label="服务器端口"
                           path="port">
                <n-input v-model:value="formValue.port"
                         placeholder="请输入端口" />
              </n-form-item>
              <n-form-item label="正版账户"
                           path="username">
                <n-input v-model:value="formValue.username"
                         placeholder="请输入账号" />
              </n-form-item>
              <n-form-item label="正版密码"
                           path="password">
                <n-input v-model:value="formValue.password"
                         type="password"
                         placeholder="请输入密码" />
              </n-form-item>
              <n-form-item>
                <n-button @click="lj"
                          :loading="ljloading"
                          :disabled="ljloading">连接</n-button>
              </n-form-item>
            </n-form>
          </n-modal>
          <n-button type="error"
                    @click="quit">
            关闭
          </n-button>
        </n-space>
      </n-space>
    </n-layout-header>
    <n-layout-content bordered
                      content-style="min-height: 340px;"
                      :native-scrollbar="false">
      <n-card style="height: 390px">
        <n-space vertical>
          <n-card v-for="(mag,i) in mags"
                  :key="i"
                  :title="mag.username">
            <template #header-extra>
              <n-time :time="mag.time" />
            </template>
            {{mag.char}}
          </n-card>
        </n-space>

      </n-card>
    </n-layout-content>
    <n-layout-footer bordered
                     style="min-height: 150px;">
      <n-card>
        <n-space vertical>
          <n-input v-model:value="seedchar"
                   type="textarea"
                   placeholder="请输入内容" />
          <n-space justify="end">
            <n-button type="success"
                      @click="seedc"
                      :disabled="!setupdisabled">
              发送
            </n-button>
          </n-space>
        </n-space>
      </n-card>
    </n-layout-footer>
  </n-layout>

</template>

<script setup>
import { ref } from "@vue/reactivity";
//import { ipcRenderer } from 'electron';
const { ipcRenderer } = window.require('electron')

const setupdisabled = ref(false)
const showModal = ref(false)
const ljloading = ref(false)
var seedc = ref(null)
const seedchar = ref("")
const formRef = ref()
const formValue = ref({
  ws: "127.0.0.1:3000",
  host: "",
  port: "",
  username: "",
  password: ""
})
const mags = ref([{
  username: "欢迎使用",
  char: "请点击右上角设置！",
  time: new Date()
}])
const rules = {
  ws: {
    required: true,
    message: '请输入通信地址',
    trigger: 'blur'
  },
  host: {
    required: true,
    message: '请输入服务器地址',
    trigger: 'blur'
  },
  username: {
    required: true,
    message: '请输入账号',
    trigger: 'blur'
  },
}
// 连接按钮事件
const lj = () => {
  formRef.value?.validate((errors) => {
    if (!errors) {
      console.log('验证通过')
      ljloading.value = true;
      const WS = new WebSocket("ws://" + formValue.value.ws)
      const seedMessage = {
        tape: "",
        date: null,
        mag: "",
      };
      WS.addEventListener('message', function (e) {
        console.log("收到信息===>" + e.data);
        const res = JSON.parse(e.data)
        if (res.tape == "chat") {
          mags.value.push({
            username: res.date.user,
            char: res.date.meg
          })
        } else {
          // 登录成功！
          console.log(res.tape);
          if (res.tape == "login") {
            ljloading.value = false;
            setupdisabled.value = true;
            showModal.value = false;
          }
          mags.value.push({
            username: "系统:" + res.mag,
            char: res.date ?? res.mag,
            time: new Date()
          })
        }
      }, false)
      WS.addEventListener('open', function (e) {
        console.log("WS open", e);
        seedMessage.tape = "create"
        seedMessage.date = {
          host: formValue.value.host,
          port: formValue.value.port,
          username: formValue.value.username, // minecraft username
          password: formValue.value.password,
        }
        WS.send(JSON.stringify(seedMessage))
        seedc.value = () => {
          seedMessage.tape = "chat"
          seedMessage.date = seedchar.value
          console.log(JSON.stringify(seedMessage).toString());
          WS.send(JSON.stringify(seedMessage).toString())
          seedchar.value = ""
        }
      }, false)
      WS.addEventListener('close', function (e) {
        console.log("WS close", e);
        ljloading.value = false;
      }, false)
      WS.addEventListener('error', function (e) {
        console.log("WS error", e);
        ljloading.value = false;
      }, false)
    }
  })
}
function quit () {
  ipcRenderer.send("close")
}
</script>

<style>
.t {
  -webkit-app-region: drag;
}
.nt {
  -webkit-app-region: no-drag;
}
</style>
