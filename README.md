<h1 align="center">Gauk</h1>

<br />

<div align="center">

<img src="https://img.shields.io/bundlephobia/minzip/gauk?style=flat-square" />
<img src="https://img.shields.io/npm/v/gauk?style=flat-square" />
 
</div>

## The what

The axios inspired fetch wrapper

## WIP

Docs are WIP

## API

```ts
class Gauk {
    get<T>(url: string, optionsUser?: OptionsUser): Promise<IResponse<T>>;
    del<T>(url: string, optionsUser?: OptionsUser): Promise<IResponse<T>>;
    post<T>(url: string, body: any, optionsUser?: OptionsUser): Promise<IResponse<T>>;
    put<T>(url: string, body: any, optionsUser?: OptionsUser): Promise<IResponse<T>>;
}
```
