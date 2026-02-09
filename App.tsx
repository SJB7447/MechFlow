import streamlit as st
import google.generativeai as genai
from PIL import Image
  from supabase import create_client
  from datetime import datetime

# --- 1. 설정 및 비밀 키 불러오기(Secrets)-- -
  st.set_page_config(
    page_title = "MechFlow | Pro Diagnostics",
    page_icon = "⚙️",
    layout = "wide"
  )

#[핵심] secrets.toml에서 키를 가져옵니다.
  try:
GOOGLE_API_KEY = st.secrets["GOOGLE_API_KEY"]
SUPABASE_URL = st.secrets["SUPABASE_URL"]
SUPABASE_KEY = st.secrets["SUPABASE_KEY"]
except FileNotFoundError:
st.error("비밀 키 설정 파일(.streamlit/secrets.toml)을 찾을 수 없습니다.")
st.stop()

# Supabase 연결
@st.cache_resource
def init_supabase():
try:
return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
return None

supabase = init_supabase()

# Gemini 설정(자동 연결)
genai.configure(api_key = GOOGLE_API_KEY)


# -- - 2. 스타일링(CSS)-- -
  st.markdown("""
<style>
    .main - title { font- size: 3rem; font - weight: 800; color: #1E293B; margin - bottom: 0.5rem;}
    .sub - title { font - size: 1.2rem; color: #475569; margin - bottom: 2rem; }
    .report - box { background - color: #F8FAFC; padding: 20px; border - radius: 10px; border: 1px solid #E2E8F0; }
    .success - badge { color: white; background - color: #22C55E; padding: 4px 8px; border - radius: 4px; font - size: 0.8em; }
</style >
  """, unsafe_allow_html=True)

# -- - 3. 인증 및 DB 함수-- -
  def sign_in(email, password):
try:
return supabase.auth.sign_in_with_password({ "email": email, "password": password })
except: return None

def sign_up(email, password, nickname, role):
try:
return supabase.auth.sign_up({
  "email": email, "password": password,
  "options": { "data": { "nickname": nickname, "role": role } }
})
except: return None

def save_log(user_id, machine_type, symptom, diagnosis):
try:
data = { "user_id": user_id, "machine_type": machine_type, "symptom": symptom, "diagnosis": diagnosis }
supabase.table("logs").insert(data).execute()
return True
except: return False

def get_logs(user_id):
try:
res = supabase.table("logs").select("*").eq("user_id", user_id).order("created_at", desc = True).execute()
return res.data
except: return []

# -- - 4. 메인 앱 로직-- -
  def main_app(session):
user = session.user
meta = user.user_metadata
nickname = meta.get('nickname', 'User')
role = meta.get('role', 'Barista')

with st.sidebar:
st.title("MechFlow Pro")
st.info(f"Logon: **{nickname}**")
st.caption(f"Role: {role} Mode")

menu = st.radio("Menu", ["🛠️ AI 정밀 진단", "📋 나의 수리 이력"])

st.divider()
        # API 키 입력창이 사라졌습니다!(자동 연결됨)
st.success("System Online 🟢")

if st.button("로그아웃"):
  supabase.auth.sign_out()
st.session_state['logged_in'] = False
st.rerun()

if menu == "🛠️ AI 정밀 진단":
  st.markdown(f'<div class="main-title">⚙️ MechFlow AI</div>', unsafe_allow_html = True)
st.markdown(f'<div class="sub-title">Powered by Gemini 1.5 & Supabase</div>', unsafe_allow_html = True)

col1, col2 = st.columns([1, 1])
with col1:
m_type = st.selectbox("장비 선택", ["에스프레소 머신", "그라인더", "제빙기"])
tab1, tab2 = st.tabs(["📸 카메라", "📂 파일"])
img = None
with tab1:
c = st.camera_input("촬영")
if c: img = Image.open(c)
with tab2:
u = st.file_uploader("업로드", type = ['jpg', 'png'])
if u: img = Image.open(u)

with col2:
symptom = st.text_area("증상 설명", height = 150)
if st.button("진단 시작", type = "primary", use_container_width = True):
  with st.spinner("전문가 AI 분석 중..."):
  try:
role_guide = "기술적 용어와 회로도를 기반으로 설명하세요." if role == "Engineer" else "초보자도 따라 할 수 있게 안전 위주로 설명하세요."
prompt = f"""
Role: { role_guide }
Device: { m_type }
Symptom: { symptom }
Format: [원인] -> [해결책] -> [부품] -> [주의사항]
Language: Korean
"""
inputs = [img, prompt] if img else[prompt]
model = genai.GenerativeModel('gemini-1.5-flash')
res = model.generate_content(inputs)

st.success("진단 완료!")
st.markdown(f"<div class='report-box'>{res.text}</div>", unsafe_allow_html = True)

if save_log(user.id, m_type, symptom, res.text):
  st.toast("이력이 클라우드에 저장되었습니다.")
                    except Exception as e:
st.error(f"Error: {e}")

    elif menu == "📋 나의 수리 이력":
st.subheader("📂 Diagnosis Logs")
logs = get_logs(user.id)
if logs:
  for log in logs:
    dt = datetime.fromisoformat(log['created_at']).strftime("%Y-%m-%d %H:%M")
with st.expander(f"{dt} | {log['machine_type']} | {log['symptom'][:20]}..."):
st.write(log['diagnosis'])
        else:
st.info("기록이 없습니다.")

# -- - 5. 로그인 화면-- -
if 'logged_in' not in st.session_state: st.session_state['logged_in'] = False

if st.session_state['logged_in']:
  main_app(st.session_state['session'])
else:
st.markdown(f'<div class="main-title">🔐 MechFlow Login</div>', unsafe_allow_html = True)
t1, t2 = st.tabs(["로그인", "회원가입"])
with t1:
e = st.text_input("Email")
p = st.text_input("PW", type = "password")
if st.button("Login"):
  res = sign_in(e, p)
if res and res.user:
st.session_state['logged_in'] = True
st.session_state['session'] = res
st.rerun()
            else: st.error("로그인 실패")
with t2:
ne = st.text_input("New Email")
np = st.text_input("New PW", type = "password")
nn = st.text_input("Nickname")
nr = st.selectbox("Role", ["Barista", "Engineer"])
if st.button("Sign Up"):
  if sign_up(ne, np, nn, nr): st.success("가입 성공! 로그인하세요.")
  else: st.error("가입 실패")