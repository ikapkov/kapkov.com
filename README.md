# Kapkov.com 3D gallery

Статичен уебсайт с галерия от архитектурни проекти и Three.js viewer за `.glb`
модели.

## Структура на проект

Всеки обект стои в отделна папка:

```text
projects/
  Име на обекта/
    cover.jpg, cover.png, cover.webp или cover.svg
    image-02.jpg
    image-03.jpg
    model.glb
    description.txt
```

Името на папката е името на обекта. За да се покаже в галерията, добавете
папката и в `projects/projects.json`:

```json
[
  { "folder": "Име на обекта" }
]
```

`model.glb` е по избор. Ако файлът липсва, сайтът показва само картинката и
описанието. Ако съществува, първо се показва картинката, след зареждане тя
изчезва с fade и остава интерактивният 3D модел.

Сайтът автоматично търси cover файл в този ред: `cover.jpg`, `cover.jpeg`,
`cover.png`, `cover.webp`, `cover.svg`.

Ако проектът има повече снимки, добавете ги в `projects/projects.json` като
`images`. Първата снимка е основната в галерията:

```json
{
  "folder": "Име на обекта",
  "images": ["cover.jpg", "image-02.jpg", "image-03.jpg"]
}
```

## Препоръчан pipeline

Revit -> IFC -> Blender/конвертор -> GLB -> Three.js website

В Blender е добре моделът да се почисти преди експорт: премахване на ненужни
елементи, обединяване на материали, компресиране на текстури и експортиране в
`.glb`.
