import { PRODUCT_PAGE_SIZE } from '@/constants';
import { useFetchProducts } from '@/lib/product';
import { formatPrice } from '@/utils/formatter';
import {
  mockUseAuthStore,
  mockUseCartStore,
  mockUseToastStore,
} from '@/utils/test/mockZustandStore';
import render from '@/utils/test/render';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mock, vi } from 'vitest';
import { ProductList } from '../ProductList';
import { useNavigate } from 'react-router-dom';
import { navigateFn } from '@/utils/test/setupTests';

const createMockData = ({
  products = [],
  hasNextPage = false,
  totalCount = products.length,
  nextPage = undefined,
  fetchNextPageFn = vi.fn(),
} = {}) => ({
  pages: [
    {
      products,
      hasNextPage,
      totalCount,
      nextPage,
    },
  ],
  pageParams: [undefined],
});

const mockProducts = [
  {
    id: '1',
    title: 'Product 1',
    price: 1000,
    category: { id: '1', name: 'category1' },
    image: 'image_url_1',
  },
  {
    id: '2',
    title: 'Product 2',
    price: 2000,
    category: { id: '2', name: 'category2' },
    image: 'image_url_2',
  },
];

describe('ProductList Component', () => {
  it('로딩이 완료된 경우 상품 리스트가 제대로 모두 노출된다', async () => {
    // Arrange: Mock 데이터 설정 및 useFetchProducts 훅의 반환 값 설정
    const mockData = createMockData({ products: mockProducts });

    useFetchProducts.mockReturnValue({
      data: mockData,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });

    // Act: ProductList 컴포넌트 렌더링
    render(<ProductList />);

    const productImages = screen.getAllByRole('img');
    const productTitles = screen.getAllByRole('heading', { level: 3 });
    // Assert: 모든 상품 카드가 올바르게 렌더링되었는지 확인
    // 이미지 확인
    expect(productImages).toHaveLength(2);
    expect(productImages[0]).toHaveAttribute('alt', 'Product 1 상품 이미지');
    expect(productImages[1]).toHaveAttribute('alt', 'Product 2 상품 이미지');

    // 제목 확인
    expect(productTitles).toHaveLength(2);
    expect(productTitles[0]).toHaveTextContent('Product 1');
    expect(productTitles[1]).toHaveTextContent('Product 2');

    // 가격 확인
    expect(screen.getByText('₩1,000')).toBeInTheDocument();
    expect(screen.getByText('₩2,000')).toBeInTheDocument();
  });

  it('보여줄 상품 리스트가 더 있는 경우 "더 보기" 버튼이 노출되며, 버튼을 누르면 상품 리스트를 더 가져온다.', async () => {
    // Arrange: 추가 페이지가 있는 mock 데이터 및 fetchNextPage 함수 모킹
    const fetchNextPageFn = vi.fn();

    const mockData = createMockData({
      products: mockProducts,
      hasNextPage: true,
      totalCount: 4,
      nextPage: 2,
      fetchNextPageFn,
    });

    useFetchProducts.mockReturnValue({
      data: mockData,
      fetchNextPage: fetchNextPageFn,
      hasNextPage: true,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });

    // Act: ProductList 컴포넌트 렌더링
    render(<ProductList />);

    const moreBtn = screen.getByRole('button', { name: '더 보기' }); //버튼이 존재할 때 찾음
    expect(moreBtn).toBeInTheDocument();

    await userEvent.click(moreBtn);

    // Assert: "더 보기" 버튼이 표시되고 클릭 시 fetchNextPage 함수가 호출되는지 확인
    expect(fetchNextPageFn).toHaveBeenCalled();
  });

  it('보여줄 상품 리스트가 없는 경우 "더 보기" 버튼이 노출되지 않는다.', async () => {
    // Arrange: 상품이 없는 mock 데이터 설정
    const mockData = createMockData({ products: [] });

    useFetchProducts.mockReturnValue({
      data: mockData,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });

    // Act: ProductList 컴포넌트 렌더링
    render(<ProductList />);

    // Assert: "더 보기" 버튼이 노출되지 않는지 확인
    const moreBtn = screen.queryByRole('button', { name: '더 보기' }); //버튼이 존재 하지 않으면 null 반환
    expect(moreBtn).not.toBeInTheDocument();
  });

  describe('로그인 상태일 경우', () => {
    beforeEach(() => {
      // Arrange: 로그인 상태 모킹
      mockUseAuthStore({ isLoggedin: true });
      navigateFn.mockClear(); // navigateFn 초기화
    });

    it('구매 버튼 클릭시 addCartItem 메서드가 호출되며, "/cart" 경로로 navigate 함수가 호출된다.', async () => {
      // Arrange: 장바구니에 아이템 추가하는 함수 및 mock 데이터 설정
      const addCartItemFn = vi.fn();
      mockUseCartStore({ addCartItem: addCartItemFn });

      const mockData = createMockData({ products: mockProducts });
      useFetchProducts.mockReturnValue({
        data: mockData,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
      });

      // Act: ProductList 컴포넌트 렌더링 및 구매 버튼 클릭
      await render(<ProductList />);

      // const buyBtn = screen.getAllByText('구매하기')[0];
      const buyBtn = screen.getAllByRole('button', { name: '구매하기' })[0];
      await userEvent.click(buyBtn);

      // Assert: addCartItem 호출 및 navigate 함수 호출 확인
      expect(addCartItemFn).toHaveBeenNthCalledWith(1, mockProducts[0]);
      expect(navigateFn).toHaveBeenNthCalledWith(1, '/cart');
    });

    it('장바구니 버튼 클릭시 "장바구니 추가 완료!" toast를 노출하며, addCartItem 메서드가 호출된다.', async () => {
      // Arrange: 장바구니 추가 함수 및 toast 함수 모킹, mock 데이터 설정
      const addCartItemFn = vi.fn();
      const addToastFn = vi.fn();
      mockUseCartStore({ addCartItem: addCartItemFn });
      mockUseToastStore({ showToast: addToastFn });

      const mockData = createMockData({ products: mockProducts });
      useFetchProducts.mockReturnValue({
        data: mockData,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
      });

      // Act: ProductList 컴포넌트 렌더링 및 장바구니 버튼 클릭
      await render(<ProductList />);

      const cartBtn = screen.getAllByRole('button', {
        name: '장바구니',
      })[0];
      await userEvent.click(cartBtn);
      // Assert: addCartItem 호출 및 toast 메시지 표시 확인
      expect(addCartItemFn).toHaveBeenNthCalledWith(1, mockProducts[0]);
      expect(addToastFn).toHaveBeenCalledWith('장바구니 추가 완료!');
    });
  });

  describe('로그인이 되어 있지 않은 경우', () => {
    beforeEach(() => {
      // Arrange: 로그아웃 상태 모킹
      mockUseAuthStore({ isLoggedin: false });
      navigateFn.mockClear(); // navigateFn 초기화
    });

    it('구매 버튼 클릭시 "/login" 경로로 navigate 함수가 호출된다.', async () => {
      // Act: ProductList 컴포넌트 렌더링 및 구매 버튼 클릭

      await render(<ProductList />);
      const buyBtn = screen.getAllByRole('button', { name: '구매하기' })[0];
      await userEvent.click(buyBtn);

      // Assert: navigate 함수가 "/login"으로 호출되었는지 확인
      expect(navigateFn).toHaveBeenNthCalledWith(1, '/login');
    });

    it('장바구니 버튼 클릭시 "/login" 경로로 navigate 함수가 호출된다.', async () => {
      // Act: ProductList 컴포넌트 렌더링 및 장바구니 버튼 클릭
      await render(<ProductList />);

      const cartBtn = screen.getAllByRole('button', { name: '장바구니' })[0];
      await userEvent.click(cartBtn);
      // Assert: navigate 함수가 "/login"으로 호출되었는지 확인
      expect(navigateFn).toHaveBeenNthCalledWith(1, '/login');
    });
  });
});
