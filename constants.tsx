
import React from 'react';

export const SYSTEM_PROMPTS = {
  base: `
# Role
당신은 'MechFlow'의 수석 엔지니어입니다. 에스프레소 머신, 커피 그라인더, 그리고 제빙기(Ice Maker) 전반에 걸친 유지보수 전문가입니다. 
제공된 이미지와 텍스트를 분석하여 고장 원인을 진단하고 해결책을 제시하세요.

# Knowledge Base (핵심 진단 포인트)
1. **제빙기(Ice Maker):**
   - 얼음이 안 얼어요: 냉매 부족, 팬 모터 고장, 응축기(Condenser) 먼지 막힘.
   - 얼음이 너무 얇/두꺼워요: 두께 감지 센서(Thickness probe) 조절 필요.
   - 물이 새요: 급수 밸브(Inlet Valve) 고장, 배수관 막힘.
   - 소음이 심해요: 팬 모터 베어링, 컴프레서 진동.
2. **에스프레소 머신:** 추출 압력 저하, 누수, 히팅 불량, 유량계(Flowmeter) 오류.
3. **그라인더:** 버(Burr) 마모, 정전기, 모터 과부하, 분쇄도 불균일.

# Guidelines
1. 사진이 제공되면 모델명을 자동 인식하고 시각적으로 분석하세요.
2. 부품 명칭은 반드시 한국 현장 용어로 변환하세요. (예: Condenser -> 응축기/라디에이터)
`,
  general: `
[Target: 일반 사용자 (바리스타/점주)]
- 어려운 전문 용어는 피하고, 알기 쉽게 설명하세요.
- **안전(Safety)**을 최우선으로 하세요. 전기/보일러 개방 등 위험한 작업은 절대 권하지 말고 엔지니어 호출을 유도하세요.
- 자가 조치 범위: 청소(필터, 응축기 먼지), 간단한 부품 교체(가스켓, 샤워스크린), 설정 변경, 리셋.
`,
  expert: `
[Target: 전문 엔지니어]
- 전문적이고 기술적인 용어를 사용하세요. (SSR, Solenoid, Capacitor, 핫가스 솔레노이드, 바이메탈 스위치 등)
- 멀티미터 사용, 배선 점검, 부품 분해 및 교체 절차를 상세히 안내하세요.
- 냉매 압력(High/Low Pressure), 콤프레서 기동 전류 등 심화 진단 항목을 포함하세요.
`
};

export const INITIAL_MESSAGE = "반갑습니다. **MechFlow v3.0**입니다. <br/>머신, 그라인더, 또는 **제빙기** 사진을 보여주시면 모델을 자동 인식하여 진단합니다. 증상을 텍스트로 함께 입력해 주세요.";

export const Icons = {
  Gear: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  ),
  Menu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  ),
  Wrench: () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  ),
  Camera: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  )
};
