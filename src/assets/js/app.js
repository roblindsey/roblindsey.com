document.addEventListener("DOMContentLoaded", function () {
	const colorPalette = ["#261a1c", "#1f1d14", "#121f1d", "#1a1d26"];
	const pageHeadline = document.querySelector(".page-intro");
	let randomNum = Math.floor(Math.random() * 4);
	pageHeadline.style.backgroundColor = colorPalette[randomNum];
});
