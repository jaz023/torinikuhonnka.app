const scriptURL = 'https://script.google.com/macros/s/AKfycbzrvZWaULS7W_Mgyw_icVS4n9EnaeBNLiX3TY4WZDvkGxAaLTZVrzjbRFitx-Jk_T3G/exec';

const orderForm = document.getElementById('orderForm');
const confirmModal = document.getElementById('confirmModal');
const orderSummary = document.getElementById('orderSummary');

orderForm.addEventListener('submit', function (e) {
  e.preventDefault();

  orderSummary.innerHTML = '';

  const items = document.querySelectorAll('.menu-item');
  let hasOrder = false;

  items.forEach(item => {
    const selectQty = item.querySelector('.qty');
    const inputQty  = item.querySelector('.qty-input');

    // ✅ 補上 radix 10 + 防空值
    let qty = 0;
    if (selectQty.value === 'other') {
      qty = parseInt((inputQty?.value ?? '0'), 10) || 0;
    } else {
      qty = parseInt((selectQty.value ?? '0'), 10) || 0;
    }

    if (!isNaN(qty) && qty > 0) {
      hasOrder = true;

      const imgSrc = item.querySelector('img').src;
      const name   = item.querySelector('h3').innerText;

      // 顯示醬汁（若有）
      const sauceEl   = item.querySelector('.sauce');
      const sauceText = sauceEl ? (sauceEl.options[sauceEl.selectedIndex]?.text ?? '') : '';

      const summaryItem = document.createElement('div');
      summaryItem.className = 'summary-item';
      summaryItem.innerHTML = `
        <img src="${imgSrc}" alt="">
        <div>
          <p>${name}</p>
          <p>數量：${qty}</p>
          ${sauceText ? `<p>醬汁：${sauceText}</p>` : ''}
        </div>
      `;
      orderSummary.appendChild(summaryItem);
    }
  });

  if (hasOrder) {
    confirmModal.classList.add('show');
  } else {
    alert('一つ選んでください/請至少選擇一項商品');
  }
});

function closeModal() {
  confirmModal.classList.remove('show');
}

document.getElementById('submitOrder').addEventListener('click', function () {
  const name  = document.getElementById('name').value.trim();
  const items = document.querySelectorAll('.menu-item');
  
  if (!name) {
    alert('名前を入力してください/請輸入姓名');
    closeModal();
    return;
  }

  const formData = new FormData();
  formData.append('name', name);

  let count = 0;

  for (const item of items) {
    const selectQty = item.querySelector('.qty');
    const inputQty  = item.querySelector('.qty-input');
    const note      = item.querySelector('.note') ? item.querySelector('.note').value.trim() : '';
    const itemName  = selectQty.getAttribute('data-item') || (item.querySelector('h3')?.innerText ?? '');

    // 讀醬汁（防沒有 .sauce 的卡片）
    const sauceEl   = item.querySelector('.sauce');
    const sauceVal  = sauceEl ? (sauceEl.value || '') : '';
    const sauceText = sauceEl ? (sauceEl.options[sauceEl.selectedIndex]?.text ?? '') : '';

    // 數量（補 radix 10 + 防空值）
    let qty = 0;
    if (selectQty.value === 'other') {
      const val = parseInt((inputQty?.value ?? ''), 10);
      if (isNaN(val) || val < 1) {
        alert('数量を入力してください/請輸入有效的數量');
        inputQty?.focus();
        return;
      }
      qty = val;
    } else {
      qty = parseInt((selectQty.value ?? '0'), 10) || 0;
    }

    // （可選）若有數量就一定要選醬汁 → 想啟用就取消下列註解
    // if (qty > 0 && sauceEl && !sauceVal) {
    //   alert('醬汁を選択してください / 請選擇醬汁');
    //   sauceEl.focus();
    //   return;
    // }

    // 價格/小計
    const priceEl = item.querySelector('.price');
    const price   = priceEl ? parseInt(priceEl.dataset.price || '0', 10) : 0;
    const subtotal = price * qty;

    if (qty > 0) {
      count++;
      formData.append('item'       + count, itemName);
      formData.append('sauceVal'   + count, sauceVal);   // option 的 value（e.g. "kimchi"）
      formData.append('sauceText'  + count, sauceText);  // 顯示文字（e.g. "キムチ/黃金泡菜"）
      formData.append('qty'        + count, qty);
      formData.append('note'       + count, note);
      formData.append('price'      + count, price);
      formData.append('subtotal'   + count, subtotal);

      console.log(`商品 ${itemName} | 醬汁 ${sauceVal} (${sauceText}) | 數量 ${qty} | 價格 ${price} | 小計 ${subtotal}`);
    }
  }

  if (count === 0) {
    alert('一つ選んでください/請選擇至少一樣商品');
    return;
  }

  // 🔎 除錯：列出要送到 GAS 的 payload
  console.group('[DEBUG] FormData payload');
  for (const [k, v] of formData.entries()) console.log(k, '=>', v);
  console.groupEnd();

  // 送單按鈕鎖定，避免連點重複送出
  const btn = document.getElementById('submitOrder');
  btn.disabled = true;

  fetch(scriptURL, { method: 'POST', body: formData })
    .then(res => res.text())
    .then(text => {
      // 你也可以檢查 text 是否為 'OK' / 'NO_ITEMS'
      orderForm.reset();
      closeModal();
      document.getElementById('finalConfirmModal').classList.add('show');

      // 隱藏並重置所有「自訂數量」欄位
      document.querySelectorAll('.qty-input').forEach(input => {
        input.style.display = 'none';
        input.value = 0;
        input.required = false;
      });
    })
    .catch(error => {
      console.error('送出失敗:', error);
      alert('もう一度試してみます\n送出失敗，請稍後再試');
    })
    .finally(() => {
      btn.disabled = false;
    });
});

// 監聽 select 變化，控制「其他」數字輸入框顯示與必填
document.querySelectorAll('.qty').forEach(select => {
  select.addEventListener('change', function () {
    const input = this.closest('.menu-item')?.querySelector('.qty-input');
    if (!input) return; // 🔒 防沒有 qty-input 的卡片
    if (this.value === 'other') {
      input.style.display = 'inline-block';
      input.value = '';
      input.required = true;
      input.focus();
    } else {
      input.style.display = 'none';
      input.value = 0;
      input.required = false;
    }
  });
});
