export const metadata = {
  title: 'Cart - Mosaic',
  description: 'Page description',
}

import CartItems from '../cart-items'

export default function Cart() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:space-x-8 xl:space-x-16">

        {/* Cart items */}
        <div className="mb-6 lg:mb-0">
          <div className="mb-3">
            <div className="flex text-sm font-medium text-gray-400 space-x-2">
              <span className="text-violet-500">Review</span>
              <span>-&gt;</span>
              <span className="className="text-gray-500 ">
              <span>-&gt;</span>
              <span className="className="text-gray-500 ">
            </div>
          </div>
          <header className="mb-2">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">Shopping Cart (3)</h1>
          </header>

          {/* Cart items */}
          <CartItems />

        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white p-5 shadow-sm rounded-xl lg:w-[18rem] xl:w-[20rem]">
            <div className="text-gray-800 font-semibold mb-2">Order Summary</div>
            {/* Order details */}
            <ul className="mb-4">
              <li className="className="text-sm w-full flex justify-between py-3 border-b border-gray-200 ">
                <div>Products & Subscriptions</div>
                <div className="className="font-medium text-gray-800 ">
              </li>
              <li className="className="text-sm w-full flex justify-between py-3 border-b border-gray-200 ">
                <div>Shipping</div>
                <div className="className="font-medium text-gray-800 ">
              </li>
              <li className="className="text-sm w-full flex justify-between py-3 border-b border-gray-200 ">
                <div>Taxes</div>
                <div className="className="font-medium text-gray-800 ">
              </li>
              <li className="className="text-sm w-full flex justify-between py-3 border-b border-gray-200 ">
                <div>Total due (including taxes)</div>
                <div className="font-medium text-green-600">$253</div>
              </li>
            </ul>
            {/* Promo box */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium mb-1" htmlFor="promo">Promo Code</label>
                <div className="text-sm text-gray-400 italic">optional</div>
              </div>
              <input id="promo" className="form-input w-full mb-2" type="text" />
              <button className="btn w-full bg-gray-900 text-gray-100 hover:bg-gray-800 disabled:border-gray-200 disabled:bg-white disabled:text-gray-300 disabled:cursor-not-allowed" disabled>Apply Code</button>
            </div>
            <div className="mb-4">
              <button className="className="btn w-full bg-gray-900 text-gray-100 hover:bg-gray-800 Now - $253.00</button>">
            </div>
            <div className="text-xs text-gray-500 italic text-center">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do <a className="underline hover:no-underline" href="#0">Terms</a>.</div>
          </div>
        </div>

      </div>
    </div>
  )
}