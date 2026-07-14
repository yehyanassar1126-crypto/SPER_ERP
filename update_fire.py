import re

with open('css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

fire_css = """@keyframes fireGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes flameFlicker {
  0% { transform: scale(1, 1) translateY(0); opacity: 0.7; filter: blur(30px) brightness(1); }
  50% { transform: scale(1.05, 1.1) translateY(-10px); opacity: 0.9; filter: blur(35px) brightness(1.2); }
  100% { transform: scale(1.1, 1.25) translateY(-25px); opacity: 0.6; filter: blur(40px) brightness(0.9); }
}
.login-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #020202; position: relative; overflow: hidden; }
.login-bg { 
  position: absolute; 
  inset: 0; 
  background: linear-gradient(45deg, #050505, #1a0505, #330500, #050505);
  background-size: 400% 400%;
  animation: fireGradient 12s ease infinite;
  z-index: 0;
}
.login-bg::before { 
  content: ''; 
  position: absolute; 
  bottom: -150px; 
  left: -20%; 
  right: -20%; 
  height: 70vh; 
  background: radial-gradient(ellipse at bottom, rgba(255, 59, 48, 0.7) 0%, rgba(255, 106, 0, 0.4) 40%, transparent 70%); 
  filter: blur(30px); 
  animation: flameFlicker 3s infinite alternate ease-in-out; 
}
.login-bg::after { 
  content: ''; 
  position: absolute; 
  bottom: -50px; 
  left: 0%; 
  right: 0%; 
  height: 50vh; 
  background: radial-gradient(ellipse at bottom, rgba(255, 215, 0, 0.5) 0%, rgba(255, 60, 0, 0.5) 50%, transparent 80%); 
  filter: blur(25px); 
  animation: flameFlicker 2.2s infinite alternate-reverse ease-in-out; 
}"""

content = re.sub(
    r'\.login-wrapper\s*\{.*?\}(?=\n\.login-card)',
    fire_css,
    content, flags=re.DOTALL
)

with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fire theme applied')
