import streamlit as st
import pandas as pd

st.set_page_config(
    page_title="MVP Rentabilidad Fulfilment",
    page_icon="💶",
    layout="wide"
)

# ==========================================================
# SUPUESTOS BASE
# ==========================================================

PACK_TYPES = ["SPK", "SPL", "MPL", "LPL"]

PACK_LABELS = {
    "SPK": "Small Packet",
    "SPL": "Small Parcel",
    "MPL": "Medium Parcel",
    "LPL": "Large Parcel",
}

# Precios de pack propuestos en la calculadora actual
PACK_PRICES = {
    "SPK": 1.62,
    "SPL": 1.62,
    "MPL": 1.73,
    "LPL": 1.78,
}

# Costes actuales usados en la calculadora (versión negociada / operativa actual)
PACK_COSTS_CALCULATOR = {
    "SPK": 0.66,
    "SPL": 0.66,
    "MPL": 1.00,
    "LPL": 1.15,
}

# Costes estándar ES del rate card (más conservadores)
PACK_COSTS_STANDARD_ES = {
    "SPK": 0.66,
    "SPL": 1.00,
    "MPL": 1.32,
    "LPL": 1.66,
}

# Picking España (ES Cost)
BASE_FIRST_PICK_COST = 0.33
BASE_ADDITIONAL_PICK_COST = 0.17

# Inserts
INSERT_PRICE = 0.08
INSERT_COST = 0.06

# Packaging base
PACKAGING_BASE_PRICE = 0.10
PACKAGING_BASE_COST = 0.01

# Goods-in / Storage usados en la calculadora actual
GOODS_IN_PALLET_PRICE = 6.43
GOODS_IN_PALLET_COST = 3.50

STORAGE_PALLET_PRICE = 8.96
STORAGE_PALLET_COST = 3.76

# Returns España
RETURN_HANDLING_PRICE = 4.75
RETURN_HANDLING_COST = 3.33

# Perfiles de producto
PRODUCT_PROFILES = {
    "Suplementos": {
        "pick_multiplier": 1.00,
        "surcharge_price": 0.02,
        "surcharge_cost": 0.01,
        "return_rate": 0.02,
    },
    "Cosmética": {
        "pick_multiplier": 1.05,
        "surcharge_price": 0.08,
        "surcharge_cost": 0.04,
        "return_rate": 0.04,
    },
    "Perfume": {
        "pick_multiplier": 1.15,
        "surcharge_price": 0.20,
        "surcharge_cost": 0.12,
        "return_rate": 0.05,
    },
    "Vidrio": {
        "pick_multiplier": 1.25,
        "surcharge_price": 0.35,
        "surcharge_cost": 0.22,
        "return_rate": 0.07,
    },
    "Perfume + vidrio": {
        "pick_multiplier": 1.35,
        "surcharge_price": 0.50,
        "surcharge_cost": 0.32,
        "return_rate": 0.08,
    },
}


# ==========================================================
# FUNCIONES AUXILIARES
# ==========================================================

def get_sku_tier(sku_count: int):
    """
    Devuelve tier, multiplicador SKU y margen objetivo de picking.
    """
    if sku_count <= 20:
        return "Simple", 1.00, 0.28
    elif sku_count <= 100:
        return "Medio", 1.10, 0.35
    else:
        return "Complejo", 1.30, 0.42


def price_from_cost_margin(cost: float, target_margin: float) -> float:
    """
    Calcula precio objetivo a partir de coste y margen deseado.
    Margin = (price - cost) / price
    """
    cost = float(cost or 0.0)
    target_margin = float(target_margin or 0.0)
    target_margin = max(0.0, min(target_margin, 0.95))
    return cost / (1.0 - target_margin)


def margin_from_price(price: float, cost: float):
    """
    Calcula margen real.
    """
    try:
        price = float(price)
        cost = float(cost)
    except Exception:
        return None

    if price == 0:
        return None

    return (price - cost) / price


def format_eur(value) -> str:
    try:
        return f"{float(value):,.2f} €"
    except Exception:
        return "n/a"


def format_pct(value) -> str:
    if value is None:
        return "n/a"
    try:
        return f"{float(value):.1%}"
    except Exception:
        return "n/a"


# ==========================================================
# ENCABEZADO
# ==========================================================

st.title("MVP Rentabilidad Fulfilment")
st.caption(
    "Calculadora operativa sin guardado de datos. "
    "Solo calcula márgenes por cliente, pick, pack, incidencias y envío."
)

# ==========================================================
# SIDEBAR / INPUTS
# ==========================================================

with st.sidebar:
    st.header("1. Cliente")

    sku_count = st.number_input(
        "Número de SKUs",
        min_value=1,
        max_value=100000,
        value=15,
        step=1
    )

    product_type = st.selectbox(
        "Tipo de producto",
        list(PRODUCT_PROFILES.keys())
    )

    pack_cost_source = st.selectbox(
        "Fuente de coste de pack",
        ["Calculadora (negociado)", "Rate card ES (estándar)"],
        help=(
            "Calculadora usa los costes actuales de tu Excel. "
            "Rate card ES usa costes estándar más conservadores."
        )
    )

    tier_name, sku_multiplier, target_pick_margin_default = get_sku_tier(int(sku_count))
    profile = PRODUCT_PROFILES[product_type]
    product_pick_multiplier = profile["pick_multiplier"]

    st.markdown(f"**Tier SKU:** {tier_name}")
    st.markdown(f"**Multiplicador SKU:** {sku_multiplier:.2f}")
    st.markdown(f"**Multiplicador producto:** {product_pick_multiplier:.2f}")

    st.header("2. Volumen")

    volume_mode = st.radio(
        "Introducir volumen como",
        ["Pedidos/día", "Pedidos/mes"]
    )

    working_days = st.number_input(
        "Días laborables/mes",
        min_value=1,
        max_value=31,
        value=22,
        step=1
    )

    if volume_mode == "Pedidos/día":
        orders_per_day = st.number_input(
            "Pedidos/día",
            min_value=0.0,
            max_value=1000000.0,
            value=30.0,
            step=0.5
        )
        orders_month = float(orders_per_day) * float(working_days)
    else:
        orders_month = st.number_input(
            "Pedidos/mes",
            min_value=0.0,
            max_value=1000000.0,
            value=660.0,
            step=1.0
        )
        orders_per_day = float(orders_month) / float(working_days) if working_days else 0.0

    units_per_order = st.number_input(
        "Units por pedido",
        min_value=1.0,
        max_value=50.0,
        value=1.5,
        step=0.1
    )

    st.header("3. Mix de pack")

    mix_spk = st.slider("SPK %", 0, 100, 0)
    mix_spl = st.slider("SPL %", 0, 100, 0)
    mix_mpl = st.slider("MPL %", 0, 100, 50)
    mix_lpl = st.slider("LPL %", 0, 100, 50)

    mix_raw = {
        "SPK": mix_spk,
        "SPL": mix_spl,
        "MPL": mix_mpl,
        "LPL": mix_lpl,
    }

    mix_total = sum(mix_raw.values())

    if mix_total == 0:
        mix = {k: 0.25 for k in PACK_TYPES}
        st.warning("Mix de pack vacío. Usando 25% en cada tipo.")
    else:
        mix = {
            k: float(v) / float(mix_total)
            for k, v in mix_raw.items()
        }

    st.header("4. Envío")

    carrier_cost = st.number_input(
        "Carrier cost (€)",
        min_value=0.0,
        max_value=1000.0,
        value=4.47,
        step=0.01
    )

    shipping_margin_target = st.slider(
        "Margen envío objetivo",
        0.0,
        0.90,
        0.20,
        0.01
    )

    st.header("5. Picking")

    pick_price_mode = st.radio(
        "Modo de precio de pick",
        ["Sugerido por margen objetivo", "Manual"]
    )

    if pick_price_mode == "Sugerido por margen objetivo":
        target_pick_margin = st.slider(
            "Margen objetivo pick",
            0.0,
            0.80,
            target_pick_margin_default,
            0.01,
            help=f"Sugerido para tier {tier_name}: {target_pick_margin_default:.0%}"
        )
        first_pick_price_manual = None
        additional_pick_price_manual = None
    else:
        target_pick_margin = None
        first_pick_price_manual = st.number_input(
            "Precio primer pick (€)",
            min_value=0.0,
            max_value=100.0,
            value=0.56,
            step=0.01
        )
        additional_pick_price_manual = st.number_input(
            "Precio pick adicional (€)",
            min_value=0.0,
            max_value=100.0,
            value=0.39,
            step=0.01
        )

    with st.expander("Ajustes avanzados"):
        inserts_per_order = st.number_input(
            "Inserts por pedido",
            min_value=0.0,
            max_value=10.0,
            value=0.0,
            step=1.0
        )

        packaging_price = st.number_input(
            "Packaging base: precio por pedido (€)",
            min_value=0.0,
            max_value=100.0,
            value=PACKAGING_BASE_PRICE,
            step=0.01
        )

        packaging_cost = st.number_input(
            "Packaging base: coste por pedido (€)",
            min_value=0.0,
            max_value=100.0,
            value=PACKAGING_BASE_COST,
            step=0.01
        )

        surcharge_price = st.number_input(
            "Incidencia/producto: precio extra por pedido (€)",
            min_value=0.0,
            max_value=100.0,
            value=float(profile["surcharge_price"]),
            step=0.01,
            key=f"surcharge_price_{product_type}"
        )

        surcharge_cost = st.number_input(
            "Incidencia/producto: coste extra por pedido (€)",
            min_value=0.0,
            max_value=100.0,
            value=float(profile["surcharge_cost"]),
            step=0.01,
            key=f"surcharge_cost_{product_type}"
        )

        return_rate = st.slider(
            "Devoluciones estimadas",
            0.0,
            0.50,
            float(profile["return_rate"]),
            0.005,
            key=f"return_rate_{product_type}"
        )

        goods_in_pallets_month = st.number_input(
            "Pallets goods-in / mes",
            min_value=0.0,
            max_value=100000.0,
            value=0.0,
            step=0.5
        )

        storage_pallet_weeks_month = st.number_input(
            "Pallet-weeks storage / mes",
            min_value=0.0,
            max_value=100000.0,
            value=0.0,
            step=0.5
        )

# ==========================================================
# CÁLCULOS
# ==========================================================

# Pack costs según fuente seleccionada
if pack_cost_source == "Calculadora (negociado)":
    pack_costs = PACK_COSTS_CALCULATOR
else:
    pack_costs = PACK_COSTS_STANDARD_ES

pack_price = sum(mix[k] * PACK_PRICES[k] for k in PACK_TYPES)
pack_cost = sum(mix[k] * pack_costs[k] for k in PACK_TYPES)

# Costes de pick ajustados por SKU y producto
first_pick_cost = BASE_FIRST_PICK_COST * sku_multiplier * product_pick_multiplier
additional_pick_cost = BASE_ADDITIONAL_PICK_COST * sku_multiplier * product_pick_multiplier

# Precios de pick
if pick_price_mode == "Sugerido por margen objetivo":
    first_pick_price = price_from_cost_margin(first_pick_cost, target_pick_margin)
    additional_pick_price = price_from_cost_margin(additional_pick_cost, target_pick_margin)
else:
    first_pick_price = float(first_pick_price_manual or 0.0)
    additional_pick_price = float(additional_pick_price_manual or 0.0)

# Units / picks por pedido
additional_units = max(0.0, float(units_per_order) - 1.0)

pick_revenue = first_pick_price + additional_units * additional_pick_price
pick_cost = first_pick_cost + additional_units * additional_pick_cost

# Inserts
insert_revenue = float(inserts_per_order) * INSERT_PRICE
insert_cost_line = float(inserts_per_order) * INSERT_COST

# Returns por pedido medio
return_revenue_per_order = float(return_rate) * RETURN_HANDLING_PRICE
return_cost_per_order = float(return_rate) * RETURN_HANDLING_COST

# Pedido sin envío
order_revenue_ex_shipping = (
    pick_revenue
    + pack_price
    + insert_revenue
    + float(packaging_price)
    + float(surcharge_price)
    + return_revenue_per_order
)

order_cost_ex_shipping = (
    pick_cost
    + pack_cost
    + insert_cost_line
    + float(packaging_cost)
    + float(surcharge_cost)
    + return_cost_per_order
)

# Envío
shipping_price = float(carrier_cost) / max(1.0 - float(shipping_margin_target), 0.01)
shipping_revenue_per_order = shipping_price
shipping_cost_per_order = float(carrier_cost)

# Mensual operativo sin envío
order_revenue_month = order_revenue_ex_shipping * float(orders_month)
order_cost_month = order_cost_ex_shipping * float(orders_month)

goods_in_revenue_month = float(goods_in_pallets_month) * GOODS_IN_PALLET_PRICE
goods_in_cost_month = float(goods_in_pallets_month) * GOODS_IN_PALLET_COST

storage_revenue_month = float(storage_pallet_weeks_month) * STORAGE_PALLET_PRICE
storage_cost_month = float(storage_pallet_weeks_month) * STORAGE_PALLET_COST

fulfilment_revenue_month_ex_shipping = (
    order_revenue_month
    + goods_in_revenue_month
    + storage_revenue_month
)

fulfilment_cost_month_ex_shipping = (
    order_cost_month
    + goods_in_cost_month
    + storage_cost_month
)

# Mensual envío
shipping_revenue_month = shipping_revenue_per_order * float(orders_month)
shipping_cost_month = shipping_cost_per_order * float(orders_month)

# Total mensual
total_revenue_month = fulfilment_revenue_month_ex_shipping + shipping_revenue_month
total_cost_month = fulfilment_cost_month_ex_shipping + shipping_cost_month
total_profit_month = total_revenue_month - total_cost_month

# Márgenes
margin_total = margin_from_price(total_revenue_month, total_cost_month)
margin_ex_shipping = margin_from_price(
    fulfilment_revenue_month_ex_shipping,
    fulfilment_cost_month_ex_shipping
)
margin_shipping = margin_from_price(shipping_revenue_month, shipping_cost_month)

margin_order_ex_shipping = margin_from_price(
    order_revenue_ex_shipping,
    order_cost_ex_shipping
)

margin_pick = margin_from_price(pick_revenue, pick_cost)
margin_first_pick = margin_from_price(first_pick_price, first_pick_cost)
margin_additional_pick = margin_from_price(additional_pick_price, additional_pick_cost)

profit_per_order = total_profit_month / float(orders_month) if orders_month else 0.0

# ==========================================================
# ALERTAS
# ==========================================================

alerts = []

if orders_month > 0 and margin_total is not None and margin_total < 0.20:
    alerts.append("El margen total está por debajo del 20%.")

if first_pick_price < first_pick_cost:
    alerts.append("El primer pick se está cobrando por debajo de su coste ajustado.")

    if additional_pick_price > additional_pick_cost:
        breakeven_units = 1 + (
            (first_pick_cost - first_pick_price)
            / (additional_pick_price - additional_pick_cost)
        )

        if units_per_order < breakeven_units:
            alerts.append(
                f"Con primer pick subsidiado, el break-even es "
                f"{breakeven_units:.2f} units/pedido. "
                f"Tu units/order es {units_per_order:.2f}."
            )
    else:
        alerts.append(
            "El pick adicional no tiene contribución positiva; "
            "no puede compensar el primer pick."
        )

if product_type in ["Perfume", "Vidrio", "Perfume + vidrio"] and surcharge_price < 0.20:
    alerts.append(
        "Producto frágil/perfume detectado: "
        "considera un surcharge >= 0.20 €/pedido."
    )

if shipping_margin_target < 0.10:
    alerts.append("El margen objetivo de envío es bajo (<10%).")

if carrier_cost >= shipping_price:
    alerts.append("El precio de envío es igual o inferior al coste carrier.")

# ==========================================================
# TABLAS
# ==========================================================

lines = [
    {
        "Línea": "Pick",
        "Ingresos": pick_revenue * float(orders_month),
        "Costes": pick_cost * float(orders_month),
    },
    {
        "Línea": "Pack",
        "Ingresos": pack_price * float(orders_month),
        "Costes": pack_cost * float(orders_month),
    },
    {
        "Línea": "Inserts",
        "Ingresos": insert_revenue * float(orders_month),
        "Costes": insert_cost_line * float(orders_month),
    },
    {
        "Línea": "Packaging",
        "Ingresos": float(packaging_price) * float(orders_month),
        "Costes": float(packaging_cost) * float(orders_month),
    },
    {
        "Línea": "Producto / incidencias",
        "Ingresos": float(surcharge_price) * float(orders_month),
        "Costes": float(surcharge_cost) * float(orders_month),
    },
    {
        "Línea": "Returns",
        "Ingresos": return_revenue_per_order * float(orders_month),
        "Costes": return_cost_per_order * float(orders_month),
    },
    {
        "Línea": "Goods-in",
        "Ingresos": goods_in_revenue_month,
        "Costes": goods_in_cost_month,
    },
    {
        "Línea": "Storage",
        "Ingresos": storage_revenue_month,
        "Costes": storage_cost_month,
    },
    {
        "Línea": "Shipping",
        "Ingresos": shipping_revenue_month,
        "Costes": shipping_cost_month,
    },
]

df_numeric = pd.DataFrame(lines)
df_numeric["Beneficio"] = df_numeric["Ingresos"] - df_numeric["Costes"]
df_numeric["Margen"] = df_numeric.apply(
    lambda row: margin_from_price(row["Ingresos"], row["Costes"]),
    axis=1
)

total_row = {
    "Línea": "TOTAL",
    "Ingresos": total_revenue_month,
    "Costes": total_cost_month,
    "Beneficio": total_profit_month,
    "Margen": margin_total,
}

df_numeric = pd.concat(
    [df_numeric, pd.DataFrame([total_row])],
    ignore_index=True
)

df_display = df_numeric.copy()
df_display["Ingresos"] = df_display["Ingresos"].apply(format_eur)
df_display["Costes"] = df_display["Costes"].apply(format_eur)
df_display["Beneficio"] = df_display["Beneficio"].apply(format_eur)
df_display["Margen"] = df_display["Margen"].apply(format_pct)

chart_df = df_numeric.set_index("Línea")[["Ingresos", "Costes"]]

order_summary = pd.DataFrame([
    {
        "Concepto": "Ingreso operativo por pedido (sin envío)",
        "Valor": format_eur(order_revenue_ex_shipping),
    },
    {
        "Concepto": "Coste operativo por pedido (sin envío)",
        "Valor": format_eur(order_cost_ex_shipping),
    },
    {
        "Concepto": "Margen operativo por pedido (sin envío)",
        "Valor": format_pct(margin_order_ex_shipping),
    },
    {
        "Concepto": "Precio envío por pedido",
        "Valor": format_eur(shipping_revenue_per_order),
    },
    {
        "Concepto": "Coste carrier por pedido",
        "Valor": format_eur(shipping_cost_per_order),
    },
    {
        "Concepto": "Beneficio total estimado por pedido",
        "Valor": format_eur(profit_per_order),
    },
])

# ==========================================================
# UI PRINCIPAL
# ==========================================================

tab_resumen, tab_desglose, tab_ratecard, tab_ayuda = st.tabs(
    ["Resumen", "Desglose", "Rate card", "Ayuda"]
)

with tab_resumen:
    st.subheader("Resumen mensual")

    c1, c2, c3, c4 = st.columns(4)

    c1.metric(
        "Pedidos/mes",
        f"{orders_month:,.0f}"
    )

    c2.metric(
        "Ingresos/mes",
        format_eur(total_revenue_month)
    )

    c3.metric(
        "Beneficio/mes",
        format_eur(total_profit_month)
    )

    c4.metric(
        "Margen total",
        format_pct(margin_total)
    )

    c5, c6, c7, c8 = st.columns(4)

    c5.metric(
        "Margen sin envío",
        format_pct(margin_ex_shipping)
    )

    c6.metric(
        "Margen envío real",
        format_pct(margin_shipping)
    )

    c7.metric(
        "Pedidos/día",
        f"{orders_per_day:,.1f}"
    )

    c8.metric(
        "Units/pedido",
        f"{units_per_order:,.2f}"
    )

    st.divider()

    st.subheader("Precio por pick")

    p1, p2, p3, p4 = st.columns(4)

    p1.metric(
        "Primer pick",
        format_eur(first_pick_price),
        f"Margen: {format_pct(margin_first_pick)}",
        delta_color="off"
    )

    p2.metric(
        "Pick adicional",
        format_eur(additional_pick_price),
        f"Margen: {format_pct(margin_additional_pick)}",
        delta_color="off"
    )

    p3.metric(
        "Coste primer pick",
        format_eur(first_pick_cost),
        delta_color="off"
    )

    p4.metric(
        "Coste pick adicional",
        format_eur(additional_pick_cost),
        delta_color="off"
    )

    st.divider()

    st.subheader("Resumen por pedido")
    st.dataframe(order_summary, use_container_width=True)

    st.divider()

    st.subheader("Alertas")

    if alerts:
        for alert in alerts:
            st.warning(alert)
    else:
        st.success("Sin alertas críticas.")

with tab_desglose:
    st.subheader("Desglose mensual")

    st.dataframe(df_display, use_container_width=True)

    st.divider()

    st.subheader("Ingresos vs costes por línea")
    st.bar_chart(chart_df)

with tab_ratecard:
    st.subheader("Supuestos base")

    base_rates = [
        {"Concepto": "Base first pick cost ES", "Valor": BASE_FIRST_PICK_COST, "Unidad": "por pick"},
        {"Concepto": "Base additional pick cost ES", "Valor": BASE_ADDITIONAL_PICK_COST, "Unidad": "por pick"},
        {"Concepto": "Insert price", "Valor": INSERT_PRICE, "Unidad": "por insert"},
        {"Concepto": "Insert cost", "Valor": INSERT_COST, "Unidad": "por insert"},
        {"Concepto": "Packaging base price", "Valor": PACKAGING_BASE_PRICE, "Unidad": "por pedido"},
        {"Concepto": "Packaging base cost", "Valor": PACKAGING_BASE_COST, "Unidad": "por pedido"},
        {"Concepto": "Goods-in pallet price", "Valor": GOODS_IN_PALLET_PRICE, "Unidad": "por pallet"},
        {"Concepto": "Goods-in pallet cost", "Valor": GOODS_IN_PALLET_COST, "Unidad": "por pallet"},
        {"Concepto": "Storage pallet price", "Valor": STORAGE_PALLET_PRICE, "Unidad": "por pallet-week"},
        {"Concepto": "Storage pallet cost", "Valor": STORAGE_PALLET_COST, "Unidad": "por pallet-week"},
        {"Concepto": "Return handling price", "Valor": RETURN_HANDLING_PRICE, "Unidad": "por retorno"},
        {"Concepto": "Return handling cost", "Valor": RETURN_HANDLING_COST, "Unidad": "por retorno"},
    ]

    st.dataframe(pd.DataFrame(base_rates), use_container_width=True)

    st.divider()

    st.subheader("Precios de pack")

    pack_table = []

    for pack_type in PACK_TYPES:
        pack_table.append({
            "Pack": PACK_LABELS[pack_type],
            "Código": pack_type,
            "Precio propuesto": PACK_PRICES[pack_type],
            "Coste calculadora": PACK_COSTS_CALCULATOR[pack_type],
            "Coste estándar ES": PACK_COSTS_STANDARD_ES[pack_type],
        })

    st.dataframe(pd.DataFrame(pack_table), use_container_width=True)

    st.divider()

    st.subheader("Perfiles de producto")

    product_df = pd.DataFrame.from_dict(PRODUCT_PROFILES, orient="index")
    product_df = product_df.reset_index()
    product_df.columns = [
        "Producto",
        "Multiplicador pick",
        "Surcharge precio",
        "Surcharge coste",
        "Return rate",
    ]

    product_df["Surcharge precio"] = product_df["Surcharge precio"].apply(format_eur)
    product_df["Surcharge coste"] = product_df["Surcharge coste"].apply(format_eur)
    product_df["Return rate"] = product_df["Return rate"].apply(format_pct)

    st.dataframe(product_df, use_container_width=True)

with tab_ayuda:
    st.subheader("Cómo funciona esta calculadora")

    st.markdown(
        """
        Esta MVP calcula márgenes operativos sin guardar datos.

        ### Fórmulas principales

        **Margen:**

        ```
        Margen = (Ingreso - Coste) / Ingreso
        ```

        **Precio objetivo por margen:**

        ```
        Precio = Coste / (1 - Margen objetivo)
        ```

        **Pick por pedido:**

        ```
        Pick revenue = Primer pick + (Units - 1) * Pick adicional
        Pick cost = Coste primer pick + (Units - 1) * Coste pick adicional
        ```

        **Envío:**

        ```
        Precio envío = Carrier cost / (1 - Margen envío objetivo)
        ```

        ### Segmentación SKU

        - Simple: hasta 20 SKUs.
        - Medio: 21 a 100 SKUs.
        - Complejo: más de 100 SKUs.

        ### Multiplicadores

        El coste de picking se ajusta por:

        ```
        Coste pick ajustado =
        Coste pick base
        * Multiplicador SKU
        * Multiplicador producto
        ```

        ### Incidencias / producto

        El surcharge de producto se añade como línea independiente:

        - Precio extra por pedido.
        - Coste extra por pedido.

        Sirve para cubrir:

        - Perfume.
        - Alcohol.
        - Vidrio.
        - Frágil.
        - Más devoluciones.
        - Más manipulación.
        - Packaging especial.

        ### Importante

        Esta herramienta no guarda datos.  
        Si refrescas o cambias de sesión, se vuelve a calcular desde cero.
        """
    )