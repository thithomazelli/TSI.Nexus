import { MatDialogRef } from '@angular/material/dialog';
import { NotificationComponent } from './notification.component';

describe('NotificationComponent', () => {
  function createComponent(data: {
    isSuccess: boolean;
    title: string;
    message: string;
  }): NotificationComponent {
    return new NotificationComponent(
      { close: vi.fn() } as unknown as MatDialogRef<NotificationComponent>,
      data,
    );
  }

  it('should create the component when instantiated', () => {
    // Act / Assert
    expect(
      createComponent({ isSuccess: true, title: 'OK', message: 'Salvo' }),
    ).toBeTruthy();
  });

  it('should read isSuccess, title and message from the dialog data', () => {
    // Act
    const component = createComponent({
      isSuccess: false,
      title: 'Erro',
      message: 'Algo deu errado',
    });

    // Assert
    expect(component.isSuccess).toBe(false);
    expect(component.title).toBe('Erro');
    expect(component.message).toBe('Algo deu errado');
  });
});
