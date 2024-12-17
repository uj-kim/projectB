import { screen, waitFor, within } from '@testing-library/react';

import {
  mockUseAuthStore,
  mockUseCartStore,
} from '@/utils/test/mockZustandStore';
import render from '@/utils/test/render';
import { ProductInfoTable } from '../ProductInfoTable';

beforeEach(() => {
  mockUseAuthStore({
    user: {
      uid: 'mocked-uid',
      email: 'test@example.com',
      displayName: '홍길동',
    },
  });
  mockUseCartStore({
    cart: [
      {
        id: '6',
        title: 'Handmade Cotton Fish',
        price: 809,
        count: 3,
        image: 'image_url_1',
      },
      {
        id: '7',
        title: 'Awesome Concrete Shirt',
        price: 442,
        count: 4,
        image: 'image_url_2',
      },
    ],
  });
});

it('장바구니에 포함된 아이템들의 이름, 수량, 합계가 제대로 노출된다', async () => {
  // Arrange: 컴포넌트를 렌더링하고, 행(row) 요소들을 가져옵니다.
  await render(<ProductInfoTable />);
  const rows = screen.getAllByRole('row');
  const dataRows = rows.slice(1); // 헤더 행을 제외한 데이터 행을 선택

  const [firstItem, secondItem] = dataRows;

  const amount = within(firstItem).getByRole('spinbutton');
  const amount2 = within(secondItem).getByRole('spinbutton');
  // Assert: 첫 번째 아이템의 이름, 수량, 합계 금액을 확인합니다.
  expect(
    within(firstItem).getByText('Handmade Cotton Fish')
  ).toBeInTheDocument();
  expect(amount).toHaveValue(3);
  expect(within(firstItem).getByText('₩2,427')).toBeInTheDocument();

  // Assert: 두 번째 아이템의 이름, 수량, 합계 금액을 확인합니다.
  expect(
    within(secondItem).getByText('Awesome Concrete Shirt')
  ).toBeInTheDocument();
  expect(amount2).toHaveValue(4);
  expect(within(secondItem).getByText('₩1,768')).toBeInTheDocument();
});

it('특정 아이템의 수량이 변경되었을 때 값이 재계산되어 올바르게 업데이트 된다', async () => {
  // Arrange: 컴포넌트를 렌더링하고 첫 번째 데이터 행을 가져옵니다.
  const { user } = await render(<ProductInfoTable />);
  const dataRows = screen.getAllByRole('row');
  const [firstItem] = dataRows.slice(1); // 첫 번째 데이터 행 선택

  const amount = within(firstItem).getByRole('spinbutton');
  const total = within(firstItem).getByText('₩2,427');
  // Act: 첫 번째 아이템의 수량을 변경합니다.
  await user.clear(amount);
  await user.type(amount, '5');

  // Assert: 수량이 변경된 후 재계산된 금액이 올바르게 표시되는지 확인합니다.
  await waitFor(() => {
    expect(total.textContent).toBe('₩4,045');
  });
});

// 최대 수량을 초과할 경우 경고 메시지 확인
it('특정 아이템의 수량이 1000개로 변경될 경우 "최대 999개 까지 가능합니다!"라고 경고 문구가 노출된다', async () => {
  // Arrange: 컴포넌트를 렌더링하고 첫 번째 데이터 행을 가져옵니다.
  const alertSpy = vi.fn();
  vi.stubGlobal('alert', alertSpy);

  const { user } = await render(<ProductInfoTable />);
  const dataRows = screen.getAllByRole('row');
  const [firstItem] = dataRows.slice(1);

  const amount = within(firstItem).getByRole('spinbutton');
  // Act: 첫 번째 아이템의 수량을 1000으로 변경합니다.
  await user.clear(amount);
  await user.type(amount, '1000');
  // Assert: 최대 수량 초과 경고 메시지가 올바르게 표시되는지 확인합니다.
  expect(alertSpy).toHaveBeenCalledWith('최대 999개 까지 가능합니다!');
});

// 아이템 삭제 버튼 클릭 후 UI에서 해당 아이템이 사라지는지 확인
it('특정 아이템의 삭제 버튼을 클릭할 경우 해당 아이템이 사라진다', async () => {
  // Arrange: 컴포넌트를 렌더링하고 두 번째 데이터 행을 가져옵니다.
  const { user } = await render(<ProductInfoTable />);
  const dataRows = screen.getAllByRole('row');
  const [, secondItem] = dataRows.slice(1); // 두 번째 데이터 행 선택

  const delBtn = within(secondItem).getByRole('button');

  // Assert: 삭제 전 아이템이 화면에 있는지 확인합니다.
  expect(secondItem).toBeInTheDocument();

  // Act: 삭제 버튼을 클릭합니다.
  await user.click(delBtn);
  // Assert: 삭제 후 해당 아이템이 화면에서 사라졌는지 확인합니다.
  await waitFor(() => {
    expect(secondItem).not.toBeInTheDocument();
  });
});
