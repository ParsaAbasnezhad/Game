/* =========================================================
   MAC — نسخه‌ی فارسی نظرات مشتریان
   script.js نظرات انگلیسی را داخل خودش نگه می‌دارد؛ این فایل
   بعد از آن لود می‌شود و کاروسل را با داده‌ی فارسی جایگزین می‌کند.
   ========================================================= */
(function () {
  "use strict";

  var quoteEl = document.querySelector(".testi-quote");
  if (!quoteEl) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var testimonials = [
    {
      quote:
        "آن‌ها صنعت و مخاطبان ما را دقیق تحلیل می‌کنند و کمپین‌های اختصاصی‌ای می‌سازند که مشتریان ما را مؤثر جذب می‌کند. ایده‌های خلاقانه و تکنیک‌های پیشرفته‌شان به ما کمک کرده از رقبا جلو بمانیم.",
      name: "مایکل کایزر",
      role: "مدیرعامل / Basecamp Corp"
    },
    {
      quote:
        "از لحظه‌ای که این تیم حساب‌های ما را تحویل گرفت، سرعت پاسخ‌گویی، شفافیت گزارش‌ها و عملکرد کمپین‌ها همه بهتر شد. حالا بالاخره حس می‌کنیم بازاریابی ما فرمانده دارد.",
      name: "دانا ویتفیلد",
      role: "مدیر رشد / Northline Retail"
    },
    {
      quote:
        "فکر می‌کردیم با یک فروشنده‌ی دیگر طرفیم. اما یک تیم ضربت گرفتیم که KPIهای ما را مثل اهداف مأموریت می‌بیند — و می‌زندشان.",
      name: "راوی پاتل",
      role: "بنیان‌گذار / Ferro Outdoor"
    },
    {
      quote:
        "هر اسپرینت با یک دبریف تمام می‌شود که فقط عددها را نمی‌گوید، دلیلِ پشت عددها را هم توضیح می‌دهد. این شفافیت کمیاب است.",
      name: "النا واسکز",
      role: "مدیر بازاریابی / Cobalt Labs"
    },
    {
      quote:
        "ترافیک ارگانیک ما در دو فصل سه برابر شد، اما بیشتر از همه روش‌مند بودنشان در مسیر به یادمان ماند — بدون میان‌بر و بدون حدس و گمان.",
      name: "توماش نوواک",
      role: "مدیر عملیات / Aurex Fintech"
    }
  ];

  var idx = 0;
  var opName = document.querySelector(".op-name");
  var opRole = document.querySelector(".op-role");
  var counterEl = document.querySelector(".counter");
  var controls = document.querySelector(".testi-controls");
  if (!controls) return;

  /* دکمه‌ها را کلون می‌کنیم تا شنونده‌های انگلیسی script.js حذف شوند */
  var btns = controls.querySelectorAll(".round-btn");
  var prevBtn = btns[0];
  var nextBtn = btns[1];
  var prevClone = prevBtn.cloneNode(true);
  var nextClone = nextBtn.cloneNode(true);
  prevBtn.parentNode.replaceChild(prevClone, prevBtn);
  nextBtn.parentNode.replaceChild(nextClone, nextBtn);

  var pad = function (n) {
    return String(n + 1).padStart(2, "0");
  };

  var apply = function () {
    var t = testimonials[idx];
    quoteEl.textContent = t.quote;
    if (opName) opName.textContent = t.name;
    if (opRole) opRole.textContent = t.role;
    if (counterEl)
      counterEl.innerHTML = pad(idx) + "<span>/0" + testimonials.length + "</span>";
    quoteEl.classList.remove("switching");
  };

  var render = function () {
    if (reduceMotion) return apply();
    quoteEl.classList.add("switching");
    window.setTimeout(apply, 220);
  };

  /* در RTL دکمه‌ی سمت راست «قبلی» و سمت چپ «بعدی» است؛ ترتیب DOM همان است */
  prevClone.addEventListener("click", function () {
    idx = (idx - 1 + testimonials.length) % testimonials.length;
    render();
  });
  nextClone.addEventListener("click", function () {
    idx = (idx + 1) % testimonials.length;
    render();
  });
})();
