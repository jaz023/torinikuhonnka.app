const scriptURL = 'https://script.google.com/macros/s/AKfycbz6o_sOzI_gBZPVVZOCj5EOUMl0XvYJ5ApOMg4v8VHeGIxPE3MTBplmCXHG4AZ1PRuM/exec';

document.getElementById('orderForm').addEventListener('submit', e => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const items = document.querySelectorAll('.menu-item');

  let count = 0;

  items.forEach(item => {
    const qtyEl = item.querySelector('.qty');
    const itemName = qtyEl.dataset.item;
    const qty = parseInt(qtyEl.value);
    const note = item.querySelector('.note').value.trim();
    const priceEl = item.querySelector('.price');
    const price = priceEl ? parseInt(priceEl.dataset.price) : 0;

    if (itemName && qty > 0) {
      console.log({ itemName, qty, price, note });
      const formData = new FormData();
      formData.append('name', name);
      formData.append('item', itemName);
      formData.append('quantity', qty);
      formData.append('price', price);
      formData.append('note', note);
     

      fetch(scriptURL, {
        method: 'POST',
        body: formData
      })
      .then(res => res.text())
      .then(msg => console.log('成功傳送:', msg))
      .catch(err => console.error('錯誤:', err));

      count++;
    }
  });

  const response = document.getElementById('response');
  if (count > 0) {
    response.textContent = '發注しております！';
    document.getElementById('orderForm').reset();
  } else {
    response.textContent = '一つ以上入力してください';
  }
});
