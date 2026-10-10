const API = '../../api/'
const DAIRY_CATEGORY_ID = 2 

const faNumber = new Intl.NumberFormat('fa-IR')
const toman = (n) => faNumber.format(n) + ' تومان'


async function getJSON(file) {
  const res = await fetch(API + file)
  if (!res.ok) throw new Error('خطا: ' + res.status)
  return res.json()
}