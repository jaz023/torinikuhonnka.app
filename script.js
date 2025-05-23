const scriptURL = 'https://script.google.com/macros/s/AKfycbx4leQMwiShMQXWlet5gihix80HBJ90thLIcJi4VPUmk_rPrGtcFlNsfZM-U5G4jkkV/exec';

const orderForm = document.getElementById('orderForm');
const confirmModal = document.getElementById('confirmModal');
const orderSummary = document.getElementById('orderSummary');
const response = document.getElementById('response');

orderForm.addEventListener('submit', function (e) {
  e.preventDefault();

  orderSummary.innerHTML = '';

  const items = document.querySelectorAll('.menu-item');
  let hasOrder = false;

  items.forEach(item => {
    const selectQty = item.querySelector('.qty');
    const inputQty = item.querySelector('.qty-input');

    let qty = 0;

    if (selectQty.value === 'other') {
      qty = parseInt(inputQty.value) || 0;
    } else {
      qty = parseInt(selectQty.value) || 0;
    }

    if (!isNaN(qty) && qty > 0) {
      hasOrder = true;

      const imgSrc = item.querySelector('img').src;
      const name = item.querySelector('h3').innerText;

      const summaryItem = document.createElement('div');
      summaryItem.className = 'summary-item';
      summaryItem.innerHTML = `
        <img src="${imgSrc}" alt="">
        <div>
          <p>${name}</p>
          <p>數量：${qty}</p>
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
  const name = document.getElementById('name').value.trim();
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
    const inputQty = item.querySelector('.qty-input');
    const note = item.querySelector('.note').value.trim();
    const itemName = selectQty.getAttribute('data-item');

    let qty = 0;

    if (selectQty.value === 'other') {
      const val = parseInt(inputQty.value);
      if (isNaN(val) || val < 1) {
        alert('数量を入力してください/請輸入有效的數量');
        inputQty.focus();
        return;
      }
      qty = val;
    } else {
      qty = parseInt(selectQty.value) || 0;
    }

    const priceEl = item.querySelector('.price');
    let price = 0;
    if (priceEl) {
      price = parseInt(priceEl.dataset.price || '0');
    }

    const subtotal = price * qty;

    if (qty > 0) {
      count++;
      formData.append('item' + count, itemName);
      formData.append('qty' + count, qty);
      formData.append('note' + count, note);
      formData.append('price' + count, price);
      formData.append('subtotal' + count, subtotal);

      console.log(`商品 ${itemName} 數量 ${qty} 價格 ${price} 小計 ${subtotal}`);
    }
  }

  if (count === 0) {
    alert('一つ選んでください/請選擇至少一樣商品');
    return;
  }

  fetch(scriptURL, {
    method: 'POST',
    body: formData
  })
  .then(res => res.text())
  .then(() => {
    orderForm.reset();

    closeModal();             // = confirmModal.classList.remove('show');

    document.getElementById('finalConfirmModal').classList.add('show');

    document.querySelectorAll('.qty-input').forEach(input => {
      input.style.display = 'none';
      input.value = 0;
      input.required = false;
    });
  })
  .catch(error => {
    console.error('送出失敗:', error);
    alert('もう一度試してみます\n送出失敗，請稍後再試');
  });
});

document.querySelectorAll('.qty').forEach(select => {
  select.addEventListener('change', function () {
    const input = this.closest('.menu-item').querySelector('.qty-input');
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
