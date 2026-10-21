## CredentialForm

### Props

`mode	'login' | 'register'` -	Режим формы: влияет на требования к паролю и тексты интерфейса.
`initialValues	Partial<Credentials>` -	Начальные значения полей (например, из URL или предыдущего шага).
`onSubmit	(values: Credentials) => void | Promise<void>`	Обработчик отправки. Принимает нормализованные данные (email: trim+toLowerCase, пароль без изменений).
`externalError	string | null`	Общая ошибка от сервера. Отображается отдельным сообщением, не сбрасывая введённые данные.
`returnTo:	string` URL для редиректа после успешного действия. Сам редирект — на уровне страницы/роутера.
`disabled: boolean`	Глобальная блокировка формы (например, во время повторной отправки или в режиме read-only).
`formState	'idle' | 'submitting' | 'success' | 'error'`	Состояние, которое может задавать родитель (например, если он управляет глобальной загрузкой). Если не передан, компонент сам управляет состоянием отправки (submitting при onSubmit, error при падении onSubmit).
`onSuccess	() => void`	Обработчик успешного действия (например, закрыть модалку, показать уведомление, запустить редирект). Вызывается после успешного завершения onSubmit.
`messages	Partial<Record<'submitting' | 'success' | 'error', string>>`	Кастомные тексты для состояний. Не заданные ключи берутся из дефолтных сообщений.
`successContent	React.ReactNode	`Контент, который показывается в состоянии success вместо формы (например, «Вы успешно вошли» + кнопка «Перейти»). Если не задан, форма остаётся, но можно показать сообщение об успехе.
`className: string	`Дополнительный класс на корневой элемент для внешнего позиционирования/размеров.

### Как подключить
```tsx
import React from 'react';
import { CredentialForm } from './components/CredentialForm';

export const LoginPage = () => {
  const handleSubmit = async (values) => {
    await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    // Успех: редирект или переход на следующую страницу
    window.location.href = '/dashboard';
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '24px' }}>
      <h2>Вход в систему</h2>
      <CredentialForm
        mode="login"
        onSubmit={handleSubmit}
        externalError={null}
        returnTo="/dashboard"
      />
    </div>
  );
};
```
