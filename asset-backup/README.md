# 에셋 백업 (복도·방 화면 + 벽·문 에셋)

기준: `147d618 3차 작업: 2~10층 방 안 출구 문 자리와 복도 문·기둥 겹침 수정` / 2026-10-25에 `scripts/capture-asset-backup.py`로 만들었다.

- `복도/<층>.png`, `방/<층>/…png`: 게임 화면 그대로(플레이어·UI 숨김, 모든 층 전력 켬, 어두운 방도 밝힘). 높이 720px.
- `모듈/벽`: 공용 벽 모듈(기본벽·투명/불투명/혼합 유리벽·기둥, `2배`는 @2x). 맵에 붙일 때 쓰는 원본.
- `모듈/문`: 공용 문 세트(벽 종류별 여닫이·자동문).
- `층별/<층>/README.md`: 그 층 복도 벽이 어느 구간에 어떤 벽 모듈·문을 쓰는지 표, 실제 파일 복사본(`복도`, `문`, `방`).

| 층 | 복도 | 벽·문 정리 | 방 |
| --- | --- | --- | --- |
| B1 | [B1](복도/B1.png) | [정리](층별/B1/README.md) | [시설관리팀 사무실](방/B1/b1-office_시설관리팀_사무실.png), [방재 관제실](방/B1/b1-control_방재_관제실.png), [전력 분배실](방/B1/b1-power_전력_분배실.png), [화장실](방/B1/b1-restroom_화장실.png) |
| B2 | [B2](복도/B2.png) | [정리](층별/B2/README.md) | [ARCHI 메인 서버실](방/B2/b2-main_ARCHI_메인_서버실.png), [전력·냉각실](방/B2/b2-power_전력·냉각실.png), [연결 실험실](방/B2/b2-link_연결_실험실.png), [화장실](방/B2/b2-restroom_화장실.png) |
| 01F | [01F](복도/01F.png) | [정리](층별/01F/README.md) | [Harmony Hall](방/01F/f1-harmony_Harmony_Hall.png), [Vision Hall](방/01F/f1-vision_Vision_Hall.png), [건강관리실](방/01F/f1-clinic_건강관리실.png), [화장실](방/01F/f1-restroom_화장실.png) |
| 02F | [02F](복도/02F.png) | [정리](층별/02F/README.md) | [Harmony Hall](방/02F/f2-harmony_Harmony_Hall.png), [직원 휴게실](방/02F/f2-lounge_직원_휴게실.png), [서버실](방/02F/f2-server_서버실.png), [화장실](방/02F/f2-restroom_화장실.png) |
| 03F | [03F](복도/03F.png) | [정리](층별/03F/README.md) | [Fitness Club](방/03F/f3-fitness_Fitness_Club.png), [고객만족센터](방/03F/f3-cs_고객만족센터.png), [Studio](방/03F/f3-studio_Studio.png), [화장실](방/03F/f3-restroom_화장실.png) |
| 04F | [04F](복도/04F.png) | [정리](층별/04F/README.md) | [연구개발 업무 공간](방/04F/f4-lab_연구개발_업무_공간.png), [개발자 업무 구역](방/04F/f4-dev_개발자_업무_구역.png), [연구 회의실](방/04F/f4-meeting_연구_회의실.png), [화장실](방/04F/f4-restroom_화장실.png) |
| 05F | [05F](복도/05F.png) | [정리](층별/05F/README.md) | [연구개발실](방/05F/f5-rnd_연구개발실.png), [기술연구실](방/05F/f5-security_기술연구실.png), [회의실](방/05F/f5-meeting_회의실.png), [화장실](방/05F/f5-restroom_화장실.png) |
| 06F | [06F](복도/06F.png) | [정리](층별/06F/README.md) | [기술 개발 업무 공간](방/06F/f6-work_기술_개발_업무_공간.png), [공용 엔지니어링 구역](방/06F/f6-engineering_공용_엔지니어링_구역.png), [기술 회의실](방/06F/f6-meeting_기술_회의실.png), [화장실](방/06F/f6-restroom_화장실.png) |
| 07F | [07F](복도/07F.png) | [정리](층별/07F/README.md) | [VIP Room](방/07F/f7-vip_VIP_Room.png), [AI 테스트실](방/07F/f7-test_AI_테스트실.png), [검증실](방/07F/f7-verify_검증실.png), [화장실](방/07F/f7-restroom_화장실.png) |
| 08F | [08F](복도/08F.png) | [정리](층별/08F/README.md) | [QA 시험실](방/08F/f8-qa_QA_시험실.png), [제품기획실](방/08F/f8-planning_제품기획실.png), [공용 제품 회의실](방/08F/f8-meeting_공용_제품_회의실.png), [화장실](방/08F/f8-restroom_화장실.png) |
| 09F | [09F](복도/09F.png) | [정리](층별/09F/README.md) | [사업 업무 공간](방/09F/f9-office_사업_업무_공간.png), [영업·고객 관리 구역](방/09F/f9-sales_영업·고객_관리_구역.png), [프로젝트룸](방/09F/f9-project_프로젝트룸.png), [화장실](방/09F/f9-restroom_화장실.png) |
| 10F | [10F](복도/10F.png) | [정리](층별/10F/README.md) | [경영관리 사무실](방/10F/f10-office_경영관리_사무실.png), [임원 회의실](방/10F/f10-meeting_임원_회의실.png), [임원실](방/10F/f10-executive_임원실.png), [화장실](방/10F/f10-restroom_화장실.png) |
| 11F | [11F](복도/11F.png) | [정리](층별/11F/README.md) | [영업본부 사무실](방/11F/f11-sales_영업본부_사무실.png), [전략회의실](방/11F/f11-strategy_전략회의실.png), [마케팅 자료실](방/11F/f11-marketing_마케팅_자료실.png), [화장실](방/11F/f11-restroom_화장실.png) |
| 12F | [12F](복도/12F.png) | [정리](층별/12F/README.md) | [개발실](방/12F/f12-dev_개발실.png), [모델 평가실](방/12F/f12-eval_모델_평가실.png), [팀장실](방/12F/f12-lead_팀장실.png), [화장실](방/12F/f12-restroom_화장실.png) |
| 13F | [13F](복도/13F.png) | [정리](층별/13F/README.md) | [기술지원 상황실](방/13F/f13-ops_기술지원_상황실.png), [장비 검증실](방/13F/f13-testbay_장비_검증실.png), [고객 교육장](방/13F/f13-training_고객_교육장.png), [화장실](방/13F/f13-restroom_화장실.png) |
| 14F | [14F](복도/14F.png) | [정리](층별/14F/README.md) | [연구 자료실](방/14F/f14-archive_연구_자료실.png), [데이터 연구실](방/14F/f14-data_데이터_연구실.png), [사용자 실험실](방/14F/f14-ux_사용자_실험실.png), [화장실](방/14F/f14-restroom_화장실.png) |
| 15F | [15F](복도/15F.png) | [정리](층별/15F/README.md) | [연구실](방/15F/f15-lab_연구실.png), [세미나실](방/15F/f15-seminar_세미나실.png), [연구본부장실](방/15F/f15-director_연구본부장실.png), [화장실](방/15F/f15-restroom_화장실.png) |
| 16F | [16F](복도/16F.png) | [정리](층별/16F/README.md) | [The Kitchen](방/16F/f16-kitchen_The_Kitchen.png), [CU 편의점](방/16F/f16-cu_CU_편의점.png), [Café](방/16F/f16-cafe_Café.png), [화장실](방/16F/f16-restroom_화장실.png) |
| 17F | [17F](복도/17F.png) | [정리](층별/17F/README.md) | [화장실](방/17F/f17-restroom_화장실.png), [관리자실](방/17F/f17-manager_관리자실.png) |
| RF | [RF](복도/RF.png) | [정리](층별/RF/README.md) | - |
