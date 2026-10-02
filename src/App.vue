<template>
   <router-view></router-view>
</template>

<script>

export default {
  name:'App',
}
</script>

<style>
#app{
  font-family: Avenir, Arial, Helvetica, Arial, sans-serif;
  -webkit-flow-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

/* Thêm padding-top khoảng 60px (hoặc tùy theo chiều cao của Header) */
#app, body {
    margin: 0;
    padding-top: 60px; 
}

body{
  padding: 0;
  margin: 0;
}

.register input, .login input{
    width: 300px;
    height: 30px;
    padding-left: 20px;
    margin-bottom: 10px;
    margin-right: auto;
    margin-left: auto;
    border: 1px solid;
}

.register button, .login button{
    width: 330px;
    height: 40px;
    border: 1px solid skyblue;
    background: skyblue;
    color: #0e0d0d;
    cursor: pointer;
}
</style>