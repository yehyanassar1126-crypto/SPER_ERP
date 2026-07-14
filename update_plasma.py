import re

with open('css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

plasma_css = """@keyframes fireGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes flameFlicker {
  0% { transform: scale(1, 1) translateY(0); opacity: 0.8; filter: blur(50px) brightness(1); }
  50% { transform: scale(1.1, 1.05) translateY(-20px); opacity: 0.95; filter: blur(60px) brightness(1.2); }
  100% { transform: scale(1.05, 1.15) translateY(-40px); opacity: 0.7; filter: blur(55px) brightness(0.9); }
}
.login-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #000000; position: relative; overflow: hidden; }
.login-bg { 
  position: absolute; 
  inset: 0; 
  background: linear-gradient(-45deg, #000000, #220000, #000022, #0a0a00, #000000);
  background-size: 400% 400%;
  animation: fireGradient 15s ease infinite;
  z-index: 0;
}
.login-bg::before { 
  content: ''; 
  position: absolute; 
  bottom: -20vh; 
  left: -20%; 
  right: -20%; 
  height: 80vh; 
  background: radial-gradient(circle at 30% 80%, rgba(255, 20, 20, 0.7) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(0, 100, 255, 0.6) 0%, transparent 50%),
              radial-gradient(circle at 50% 100%, rgba(255, 220, 0, 0.6) 0%, transparent 60%);
  filter: blur(50px); 
  animation: flameFlicker 4s infinite alternate ease-in-out; 
}
.login-bg::after { 
  content: ''; 
  position: absolute; 
  top: -20vh; 
  left: -10%; 
  right: -10%; 
  height: 70vh; 
  background: radial-gradient(circle at 80% 20%, rgba(255, 20, 20, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 20% 20%, rgba(0, 100, 255, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 50% 10%, rgba(255, 220, 0, 0.3) 0%, transparent 50%);
  filter: blur(40px); 
  animation: flameFlicker 5.5s infinite alternate-reverse ease-in-out; 
}"""

# Replace existing login-wrapper through login-bg::after block
content = re.sub(
    r'@keyframes fireGradient.*?\.login-bg::after\s*\{.*?\}',
    plasma_css,
    content, flags=re.DOTALL
)

with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated theme to Red, Yellow, Blue, Black')
