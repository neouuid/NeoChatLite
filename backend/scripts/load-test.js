import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');

// 测试配置
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// 测试选项
export const options = {
  stages: [
    { duration: '30s', target: 10 },   //  ramp-up to 10 users
    { duration: '1m', target: 50 },    //  ramp-up to 50 users
    { duration: '2m', target: 100 },   //  stay at 100 users
    { duration: '30s', target: 0 },    //  ramp-down to 0
  ],
  thresholds: {
    errors: ['rate<0.1'],               // < 10% error rate
    http_req_duration: ['p(95)<500'],   // 95% requests < 500ms
  },
};

// 测试数据
let testUsers = [];
let authTokens = [];

// 主测试函数
export default function () {
  // 1. 用户注册
  const username = `loadtest_user_${__VU}_${Date.now()}`;
  const email = `${username}@test.com`;
  const password = 'Password123!';

  const registerPayload = JSON.stringify({
    username: username,
    email: email,
    password: password,
  });

  const registerParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const registerRes = http.post(`${BASE_URL}/api/v1/auth/register`, registerPayload, registerParams);
  check(registerRes, {
    'register status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  if (registerRes.status === 200) {
    // 2. 用户登录
    const loginPayload = JSON.stringify({
      identifier: email,
      password: password,
    });

    const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, registerParams);
    check(loginRes, {
      'login status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    if (loginRes.status === 200) {
      const loginData = JSON.parse(loginRes.body);
      const token = loginData.data.access_token;

      const authParams = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      // 3. 获取用户资料
      const profileRes = http.get(`${BASE_URL}/api/v1/auth/profile`, authParams);
      check(profileRes, {
        'get profile status is 200': (r) => r.status === 200,
      }) || errorRate.add(1);

      // 4. 搜索用户
      const searchRes = http.get(`${BASE_URL}/api/v1/user/search?query=loadtest`, authParams);
      check(searchRes, {
        'search users status is 200': (r) => r.status === 200,
      }) || errorRate.add(1);

      // 5. 获取会话列表
      const convRes = http.get(`${BASE_URL}/api/v1/chat/conversations`, authParams);
      check(convRes, {
        'get conversations status is 200': (r) => r.status === 200,
      }) || errorRate.add(1);

      // 6. 获取收藏列表
      const favRes = http.get(`${BASE_URL}/api/v1/chat/favorites`, authParams);
      check(favRes, {
        'get favorites status is 200': (r) => r.status === 200,
      }) || errorRate.add(1);
    }
  }

  sleep(1);
}

// 测试场景：消息发送
export function messageSendTest() {
  if (!authTokens.length) {
    console.log('No auth tokens available');
    return;
  }

  const token = authTokens[__VU % authTokens.length];

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  // 发送消息
  const payload = JSON.stringify({
    conversation_id: 'test-conversation-id',
    content: `Load test message from VU ${__VU} at ${Date.now()}`,
    message_type: 'text',
  });

  const res = http.post(`${BASE_URL}/api/v1/chat/message`, payload, params);
  check(res, {
    'send message status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.5);
}
