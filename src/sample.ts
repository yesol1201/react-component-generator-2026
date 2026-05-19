// 동작 확인용 샘플 — 의도적 결함 포함 (검증 테스트용)

export function process(d: any) {
  const result = d.items.map((x: any) => {
    return {
      id: x.id,
      val: x.value * 2,
      info: x.meta.description,
    };
  });
  return result;
}

export function getAverage(nums: number[]) {
  let total = 0;
  for (let i = 0; i < nums.length; i++) {
    total += nums[i];
  }
  return total / nums.length;
}

export async function fetchAndSave(url: string, storage: any) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    storage.set("cache", data);
    storage.set("last_fetched", Date.now());
    storage.set("count", (storage.get("count") || 0) + 1);
    console.log("saved:", data);
    return data;
  } catch (e) {
    console.log(e);
  }
}
