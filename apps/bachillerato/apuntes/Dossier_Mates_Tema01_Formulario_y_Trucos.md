# 📐 Formulario Maestro y Trucos de Supervivencia: Matemáticas I (Tema 1)
**Asignatura:** Matemáticas I (Ciencias y Tecnología) | **Profesora:** Miriam Jarauta Baigorri  
**Libro:** *Operación Mundo* — Grupo Anaya (LOMLOE)  
**Optimizado para:** Repaso rápido en el móvil y Google NotebookLM  

---

## 🎧 Introducción para la IA / Audio Overview de NotebookLM
> *Este documento es una guía matemática exhaustiva de resolución de problemas del Tema 1 de 1º de Bachillerato: la estructura del cuerpo de los números reales, topología de intervalos, ecuaciones e inecuaciones con valor absoluto, operaciones y propiedades de los radicales, los tres métodos de racionalización y las leyes de los logaritmos.*

---

## 🧮 MÓDULO 1: Conjuntos e Intervalos

### 1.1. Jerarquía de los Números
$$\mathbb{N} \subset \mathbb{Z} \subset \mathbb{Q} \subset \mathbb{R}$$
* **Naturales ($\mathbb{N}$):** $\{0, 1, 2, 3, \dots\}$
* **Enteros ($\mathbb{Z}$):** $\{\dots, -2, -1, 0, 1, 2, \dots\}$
* **Racionales ($\mathbb{Q}$):** Todo número que se puede escribir como fracción $\frac{a}{b}$ con $a, b \in \mathbb{Z}, b \neq 0$. (Decimales exactos y periódicos puros/mixtos).
* **Irracionales ($\mathbb{I}$):** Decimales infinitos no periódicos ($\sqrt{2}, \pi, e, \Phi$).
* **Reales ($\mathbb{R}$):** $\mathbb{Q} \cup \mathbb{I}$ (la recta real continua completa).

### 1.2. Operaciones con Intervalos (¡Cuidado con corchetes y paréntesis!)
* **Abierto $(a, b)$:** Extremos excluidos $\{x \in \mathbb{R} \mid a < x < b\}$.
* **Cerrado $[a, b]$:** Extremos incluidos $\{x \in \mathbb{R} \mid a \le x \le b\}$.
* **Unión ($A \cup B$):** Elementos que están en $A$, en $B$ o en ambos.
* **Intersección ($A \cap B$):** Elementos que están simultáneamente en ambos a la vez.
* **Complementario ($\overline{A}$ o $A^c$):** $\mathbb{R} \setminus A$.
  * *Truco de examen:* Si el intervalo original tiene corchete $[$, su complementario tiene paréntesis $)$. Si el original tiene $($, el complementario lleva corchete $[$.

---

## ⚡ MÓDULO 2: El Valor Absoluto (Fórmulas Infalibles para Inecuaciones)

El valor absoluto $|x|$ representa la **distancia** del número $x$ al origen $0$ en la recta real.

### Las Dos Reglas de Oro de Inecuaciones:
1. **Caso MENOR QUE ($|x| \le k$ con $k > 0$):**
   $$|x| \le k \iff -k \le x \le k \iff x \in [-k, k]$$
   * *Ejemplo examen:* $|2x - 3| < 7 \implies -7 < 2x - 3 < 7 \implies -4 < 2x < 10 \implies -2 < x < 5 \implies x \in (-2, 5)$.
2. **Caso MAYOR QUE ($|x| \ge k$ con $k > 0$):**
   $$|x| \ge k \iff x \ge k \quad \text{o} \quad x \le -k \iff x \in (-\infty, -k] \cup [k, +\infty)$$
   * *Ejemplo examen:* $|3x + 1| \ge 8 \implies 3x + 1 \ge 8 \implies x \ge \frac{7}{3}$ o $3x + 1 \le -8 \implies x \le -3$.  
   * Solución: $x \in (-\infty, -3] \cup [\frac{7}{3}, +\infty)$.

---

## 🌿 MÓDULO 3: Radicales y Operaciones

### 3.1. Propiedades Fundamentales
1. **Forma de potencia fraccionaria:** $\sqrt[n]{a^m} = a^{\frac{m}{n}}$.
2. **Raíz de un producto:** $\sqrt[n]{a \cdot b} = \sqrt[n]{a} \cdot \sqrt[n]{b}$.
3. **Raíz de un cociente:** $\sqrt[n]{\frac{a}{b}} = \frac{\sqrt[n]{a}}{\sqrt[n]{b}}$.
4. **Raíz de una raíz:** $\sqrt[m]{\sqrt[n]{a}} = \sqrt[m \cdot n]{a}$.
5. **Potencia de una raíz:** $(\sqrt[n]{a})^m = \sqrt[n]{a^m}$.

### 3.2. Reducción a Índice Común (Para multiplicar raíces de distinto índice)
* Se calcula el $\text{m.c.m.}$ de los índices.
* *Ejemplo:* $\sqrt[3]{2} \cdot \sqrt[4]{3}$.
  * $\text{m.c.m.}(3, 4) = 12$.
  * $\sqrt[3]{2} = 2^{1/3} = 2^{4/12} = \sqrt[12]{2^4} = \sqrt[12]{16}$.
  * $\sqrt[4]{3} = 3^{1/4} = 3^{3/12} = \sqrt[12]{3^3} = \sqrt[12]{27}$.
  * Producto: $\sqrt[12]{16 \cdot 27} = \sqrt[12]{432}$.

### 3.3. Extracción de Factores
* Dividir el exponente del radicando entre el índice de la raíz:
  * El **cociente** sale fuera elevando al factor.
  * El **resto** se queda dentro como exponente.
  * *Ejemplo:* $\sqrt[3]{x^7} \implies 7 / 3$: cociente $2$, resto $1 \implies x^2 \sqrt[3]{x}$.

---

## 🎯 MÓDULO 4: Racionalización (Los 3 Casos de Examen)

Eliminar raíces del denominador sin cambiar el valor de la fracción:

### Caso 1: Denominador con una sola raíz cuadrada ($\frac{a}{\sqrt{b}}$)
* Se multiplica numerador y denominador por $\sqrt{b}$:
  $$\frac{a}{\sqrt{b}} \cdot \frac{\sqrt{b}}{\sqrt{b}} = \frac{a\sqrt{b}}{b}$$

### Caso 2: Denominador con raíz de índice $n > 2$ ($\frac{a}{\sqrt[n]{b^k}}$ con $k < n$)
* Se multiplica por $\sqrt[n]{b^{n-k}}$ para completar el exponente hasta $n$:
  $$\frac{a}{\sqrt[5]{b^2}} \cdot \frac{\sqrt[5]{b^3}}{\sqrt[5]{b^3}} = \frac{a\sqrt[5]{b^3}}{\sqrt[5]{b^5}} = \frac{a\sqrt[5]{b^3}}{b}$$

### Caso 3: Denominador con suma o resta de raíces cuadradas ($\frac{a}{\sqrt{b} \pm \sqrt{c}}$)
* Se multiplica numerador y denominador por el **conjugado** (suma por diferencia = diferencia de cuadrados):
  $$\frac{a}{\sqrt{b} + \sqrt{c}} \cdot \frac{\sqrt{b} - \sqrt{c}}{\sqrt{b} - \sqrt{c}} = \frac{a(\sqrt{b} - \sqrt{c})}{(\sqrt{b})^2 - (\sqrt{c})^2} = \frac{a(\sqrt{b} - \sqrt{c})}{b - c}$$

---

## 🪵 MÓDULO 5: Logaritmos y Propiedades

### 5.1. Definición Formal
$$\log_a(x) = y \iff a^y = x \quad (a > 0, a \neq 1, x > 0)$$

### 5.2. Las 6 Leyes Universales de los Logaritmos
1. **Logaritmo de 1:** $\log_a(1) = 0$ (porque $a^0 = 1$).
2. **Logaritmo de la base:** $\log_a(a) = 1$ (porque $a^1 = a$).
3. **Logaritmo de un producto:** $\log_a(x \cdot y) = \log_a(x) + \log_a(y)$.
4. **Logaritmo de un cociente:** $\log_a\left(\frac{x}{y}\right) = \log_a(x) - \log_a(y)$.
5. **Logaritmo de una potencia:** $\log_a(x^n) = n \cdot \log_a(x)$.
6. **Logaritmo de una raíz:** $\log_a(\sqrt[n]{x}) = \frac{1}{n} \log_a(x)$.

### 5.3. Fórmula de Cambio de Base (Para la calculadora Casio)
$$\log_a(x) = \frac{\ln(x)}{\ln(a)} = \frac{\log_{10}(x)}{\log_{10}(a)}$$
