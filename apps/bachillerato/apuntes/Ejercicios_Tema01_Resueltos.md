# 📝 Ejercicios Resueltos — Tema 1: Números Reales
**Asignatura:** Matemáticas I  
**Fuente:** Cuaderno de clase & Libro Anaya (Pág. 37)  

---

## 📌 Ejercicio 1 (Pág. 37) — Expresión de Intervalos y Operaciones

### Apartado b)
- **Enunciado:** Representar analíticamente $[4, +\infty)$.
- **Resolución:**
  $$[4, +\infty) = \{ x \in \mathbb{R} \mid x \ge 4 \}$$

### Apartado c)
- **Enunciado:** Calcular $[-2, 5] \cap (3, 7]$.
- **Resolución:**  
  Buscamos los elementos comunes a ambos intervalos.
  - El primer intervalo cubre desde $-2$ hasta $5$ (ambos incluidos).
  - El segundo intervalo cubre desde valores estrictamente mayores que $3$ hasta $7$ (incluido).
  - La intersección es la zona común:
  $$[-2, 5] \cap (3, 7] = (3, 5]$$

### Apartado d)
- **Enunciado:** Operar $[2, 5) \cup (5, 7]$.
- **Resolución:**  
  Se unen ambos intervalos, pero el número $5$ no pertenece a ninguno de los dos:
  $$[2, 5) \cup (5, 7] = [2, 7] - \{5\}$$

---

## 📌 Ejercicio 2 (Pág. 37) — Inecuaciones con Valor Absoluto

### Apartado a)
- **Inecuación:** $|x| \le 5$
- **Desarrollo:**  
  Por la propiedad $|x| \le k \iff -k \le x \le k$:
  $$-5 \le x \le 5 \implies x \in [-5, 5]$$

### Apartado b)
- **Inecuación:** $|x - 4| \le 2$
- **Desarrollo:**  
  $$-2 \le x - 4 \le 2$$
  Sumamos $4$ en los tres miembros:
  $$-2 + 4 \le x \le 2 + 4 \implies 2 \le x \le 6 \implies x \in [2, 6]$$

### Apartado c)
- **Inecuación:** $|x| < 5$
- **Desarrollo:**  
  $$-5 < x < 5 \implies x \in (-5, 5)$$

### Apartado d)
- **Inecuación:** $|x - 4| > 2$
- **Desarrollo:**  
  Por la propiedad del valor absoluto cuando es mayor estricto:
  $$x - 4 > 2 \quad \text{o bien} \quad x - 4 < -2$$
  Despejando en cada rama:
  1. $x > 2 + 4 \implies x > 6 \implies x \in (6, +\infty)$
  2. $x < -2 + 4 \implies x < 2 \implies x \in (-\infty, 2)$
  
  Unión final:
  $$x \in (-\infty, 2) \cup (6, +\infty)$$

---

## 📌 Ejercicios de Simplificación de Potencias (Cuaderno)

### Ejemplo 1:
$$\frac{3^3 \cdot 3^3 \cdot 3^4 \cdot 3}{2^2 \cdot 3^3 \cdot 3^2 \cdot 2^{-3} \cdot 3^{-1} \cdot 2^2 \cdot 3^4}$$

1. **Agrupar potencias de la misma base en el numerador:**
   $$\text{Numerador} = 3^{3 + 3 + 4 + 1} = 3^{11}$$
2. **Agrupar potencias de la misma base en el denominador:**
   $$\text{Base } 2: 2^{2 + (-3) + 2} = 2^{2 - 3 + 2} = 2^1 = 2$$
   $$\text{Base } 3: 3^{3 + 2 + (-1) + 4} = 3^{8}$$
   $$\text{Denominador} = 2^1 \cdot 3^8$$
3. **Cociente final:**
   $$\frac{3^{11}}{2 \cdot 3^8} = \frac{3^{11-8}}{2} = \frac{3^3}{2} = \frac{27}{2}$$

### Ejemplo 2 (Copiado hoy):
$$\frac{2^{12} \cdot 5^3 \cdot 3^8 \cdot 3^4 \cdot 2^1 \cdot 2^6 \cdot 3^9}{2^6 \cdot 5^3 \cdot 3^6 \cdot 3^{-3}}$$

1. **Numerador:**
   - Base 2: $2^{12 + 1 + 6} = 2^{19}$
   - Base 3: $3^{8 + 4 + 9} = 3^{21}$
   - Base 5: $5^3$
   - Numerador: $2^{19} \cdot 3^{21} \cdot 5^3$
2. **Denominador:**
   - Base 2: $2^6$
   - Base 3: $3^{6 + (-3)} = 3^3$
   - Base 5: $5^3$
   - Denominador: $2^6 \cdot 3^3 \cdot 5^3$
3. **Cociente final simplificado:**
   $$2^{19 - 6} \cdot 3^{21 - 3} \cdot 5^{3 - 3} = 2^{13} \cdot 3^{18} \cdot 1 = 2^{13} \cdot 3^{18}$$

---

## 📌 Ejercicio 6 (Cuaderno de Hoy) — Inecuaciones con Valor Absoluto

### Apartado c)
- **Inecuación:** $|2x| \le 8$
- **Resolución:**
  $$-8 \le 2x \le 8 \implies \frac{-8}{2} \le x \le \frac{8}{2} \implies -4 \le x \le 4 \implies x \in [-4, 4]$$

### Apartado d)
- **Inecuación:** $|x - 1| \le 6$
- **Resolución:**
  $$-6 \le x - 1 \le 6 \implies -6 + 1 \le x \le 6 + 1 \implies -5 \le x \le 7 \implies x \in [-5, 7]$$

