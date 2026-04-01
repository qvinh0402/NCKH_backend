const https = require('https');
const { URL } = require('url');

function httpsGetJson(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);

    const req = https.get(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        protocol: url.protocol,
        headers: {
          'User-Agent': 'shipping-fee-service/1.0',
          'Accept': 'application/json'
        }
      },
      (res) => {
        let data = '';

        res.on('data', (chunk) => (data += chunk));

        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(new Error('Invalid JSON from Goong API'));
          }
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}

// ==============================
// 🌍 Geocode Address (FIX FULL)
// ==============================
async function geocodeAddress(address, apiKey) {
  if (!apiKey) throw new Error('Missing MAPS_API_KEY');

  // ✅ FIX: thêm region=vn để tăng độ chính xác
  const endpoint = `https://rsapi.goong.io/Geocode?address=${encodeURIComponent(address)}&region=vn&api_key=${encodeURIComponent(apiKey)}`;

  const json = await httpsGetJson(endpoint);

  // ✅ DEBUG: xem full response
  console.log('🌍 Goong raw response:', JSON.stringify(json, null, 2));

  const results = json?.results;

  if (!results || results.length === 0) {
    return null;
  }

  const first = results[0];

  let lat = null;
  let lng = null;

  // ✅ Case 1: chuẩn (phổ biến nhất)
  if (first.geometry?.location) {
    lat = first.geometry.location.lat;
    lng = first.geometry.location.lng;
  }

  // ✅ Case 2: fallback (một số response khác)
  else if (first.geometry?.lat && first.geometry?.lng) {
    lat = first.geometry.lat;
    lng = first.geometry.lng;
  }

  // ❌ Không có tọa độ hợp lệ
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  return {
    lat,
    lng,
    raw: first
  };
}

module.exports = { geocodeAddress };