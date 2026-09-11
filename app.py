import streamlit as st
import pandas as pd

st.set_page_config(
    page_title="MVP Rentabilidad Fulfilment",
    page_icon="💶",
    layout="wide",
)

st.title("💶 MVP Rentabilidad Fulfilment")
st.caption(
    "Calculadora operativa por cliente: Preparación (Pack + 1er Pick), picks adicionales, incidencias, almacenamiento y envío. Modifica precios y márgenes fácilmente."
)

PACK_TYPES = ["SPK", "SPL", "MPL", "LPL"]
PACK_LABELS = {
    "SPK": "Small Packet",
    "SPL": "Small Parcel",
    "MPL": "Medium Parcel",
    "LPL": "Large Parcel",
}
PACK_PRICES_DEFAULT = {
    "SPK": 1.62,
    "SPL": 1.62,
    "MPL": 1.73,
    "LPL": 1.78,
}
PACK_COSTS_CALCULATOR = {
    "SPK": 0.66,
    "SPL": 0.66,
    "MPL": 1.00,
    "LPL": 1.15,
}
PACK_COSTS_STANDARD_ES = {
    "SPK": 0.66,
    "SPL": 1.00,
    "MPL": 1.32,
    "LPL": 1.66,
}

BASE_FIRST_PICK_COST = 0.33
BASE_ADDITIONAL_PICK_COST = 0.17
INSERT_PRICE_DEFAULT = 0.08
INSERT_COST = 0.06
PACKAGING_BASE_PRICE_DEFAULT = 0.10
PACKAGING_BASE_COST = 0.01
GOODS_IN_PALLET_PRICE_DEFAULT = 6.43
GOODS_IN_PALLET_COST = 3.50
STORAGE_PALLET_PRICE_DEFAULT = 8.96
STORAGE_PALLET_COST = 3.76
RETURN_HANDLING_PRICE_DEFAULT = 4.75
RETURN_HANDLING_COST = 3.33

PRODUCT_PROFILES = {
    "Suplementos": {"pick_mult": 1.00, "surcharge_price": 0.02, "surcharge_cost": 0.01, "return_rate": 0.02},
    "Cosmética": {"pick_mult": 1.05, "surcharge_price": 0.08, "surcharge_cost": 0.04, "return_rate": 0.04},
    "Perfume": {"pick_mult": 1.15, "surcharge_price": 0.20, "surcharge_cost": 0.12, "return_rate": 0.05},
    "Vidrio": {"pick_mult": 1.25, "surcharge_price": 0.35, "surcharge_cost": 0.22, "return_rate": 0.07},
    "Perfume + vidrio": {"pick_mult": 1.35, "surcharge_price": 0.50, "surcharge_cost": 0.32, "return_rate": 0.08},
}

def get_sku_tier(sku_count: int):
    if sku_count <= 20:
        return "Simple", 1.0, 0.28
    elif sku_count <= 100:
        return "Medio", 1.1, 0.35
    else:
        return "Complejo", 1.3, 0.42

def price_from_cost_margin(cost: float, margin: float) -> float:
    m = max(0.0, min(margin, 0.95))
    return cost / (1.0 - m) if (1.0 - m) > 0 else cost

def margin_from_price(price: float, cost: float):
    if price == 0:
        return None
    return (price - cost) / price

def format_eur(v):
    if v is None:
        return "n/a"
    return f"{v:,.2f} €"

def format_pct(v):
    if v is None:
        return "n/a"
    return f"{v * 100:.1f}%"

with st.sidebar:
    st.header("1. Cliente y Operativa")
    client_name = st.text_input("Nombre / Referencia Cliente", value="Cliente Ejemplo")
    sku_count = st.number_input("Número de SKUs", min_value=1, max_value=50000, value=15, step=1)
    product_type = st.selectbox("Tipo de producto", list(PRODUCT_PROFILES.keys()))
    pack_cost_source = st.selectbox("Fuente de coste de pack", ["Calculadora (negociado)", "Rate card ES (estándar)"])
    
    sku_tier, sku_mult, default_pick_margin = get_sku_tier(sku_count)
    prod_profile = PRODUCT_PROFILES[product_type]
    prod_mult = prod_profile["pick_mult"]
    
    st.info(f"**Tier SKU:** {sku_tier} (×{sku_mult:.2f}) | **Multiplicador producto:** ×{prod_mult:.2f}")

    st.header("2. Volumen")
    vol_mode = st.radio("Introducir volumen como", ["Pedidos/día", "Pedidos/mes"], horizontal=True)
    working_days = st.number_input("Días laborables/mes", min_value=1, max_value=31, value=22)
    if vol_mode == "Pedidos/día":
        orders_per_day = st.number_input("Pedidos/día", min_value=0.0, value=30.0, step=1.0)
        orders_month = orders_per_day * working_days
    else:
        orders_month = st.number_input("Pedidos/mes", min_value=0.0, value=660.0, step=10.0)
        orders_per_day = orders_month / working_days if working_days > 0 else 0.0
    units_per_order = st.number_input("Units por pedido", min_value=1.0, max_value=50.0, value=1.5, step=0.1)

    st.header("3. Mix de Pack")
    mix_spk = st.slider("SPK %", 0, 100, 0)
    mix_spl = st.slider("SPL %", 0, 100, 0)
    mix_mpl = st.slider("MPL %", 0, 100, 50)
    mix_lpl = st.slider("LPL %", 0, 100, 50)
    mix_sum = mix_spk + mix_spl + mix_mpl + mix_lpl
    if mix_sum == 0:
        mix = {k: 0.25 for k in PACK_TYPES}
    else:
        mix = {"SPK": mix_spk/mix_sum, "SPL": mix_spl/mix_sum, "MPL": mix_mpl/mix_sum, "LPL": mix_lpl/mix_sum}

    pack_costs = PACK_COSTS_CALCULATOR if pack_cost_source == "Calculadora (negociado)" else PACK_COSTS_STANDARD_ES
    pack_cost_calc = sum(mix[k] * pack_costs[k] for k in PACK_TYPES)
    pack_price_calc = sum(mix[k] * PACK_PRICES_DEFAULT[k] for k in PACK_TYPES)

    st.header("4. Preparación (Pack + 1er Pick)")
    st.caption("Configura costes y márgenes modificables:")
    pack_price_custom = st.number_input("Precio Pack (Preparación base) €", min_value=0.0, value=float(pack_price_calc), step=0.05)
    
    first_pick_cost = BASE_FIRST_PICK_COST * sku_mult * prod_mult
    pick_price_mode = st.radio("Modo precio picks", ["Sugerido por margen objetivo", "Manual"])
    
    if pick_price_mode == "Sugerido por margen objetivo":
        target_pick_margin = st.slider("Margen objetivo Pick", 0.0, 0.8, float(default_pick_margin), 0.01)
        first_pick_price = price_from_cost_margin(first_pick_cost, target_pick_margin)
        add_pick_cost = BASE_ADDITIONAL_PICK_COST * sku_mult * prod_mult
        add_pick_price = price_from_cost_margin(add_pick_cost, target_pick_margin)
    else:
        first_pick_price = st.number_input("Precio 1er Pick €", min_value=0.0, value=0.56, step=0.02)
        add_pick_cost = BASE_ADDITIONAL_PICK_COST * sku_mult * prod_mult
        add_pick_price = st.number_input("Precio Pick Adicional €", min_value=0.0, value=0.39, step=0.02)

    st.info(f"**Total Preparación + 1er Pick:** {pack_price_custom + first_pick_price:.2f} € (Coste: {pack_cost_calc + first_pick_cost:.2f} €)")

    st.header("5. Envío (Carrier)")
    carrier_cost = st.number_input("Carrier cost €", min_value=0.0, value=4.47, step=0.1)
    carrier_margin = st.slider("Margen carrier objetivo", 0.0, 0.6, 0.20, 0.01)
    shipping_price = carrier_cost / max(1.0 - carrier_margin, 0.01)
    st.caption(f"Precio envío sugerido: **{shipping_price:.2f} €** (+{(shipping_price - carrier_cost):.2f} € margen)")

    with st.expander("Ajustes avanzados (Servicios & Almacén)"):
        inserts_count = st.number_input("Inserts por pedido", 0, 10, 0)
        packaging_price = st.number_input("Packaging base precio €", value=PACKAGING_BASE_PRICE_DEFAULT)
        packaging_cost = st.number_input("Packaging base coste €", value=PACKAGING_BASE_COST)
        surcharge_price = st.number_input("Incidencias/Fragilidad precio €", value=prod_profile["surcharge_price"])
        surcharge_cost = st.number_input("Incidencias/Fragilidad coste €", value=prod_profile["surcharge_cost"])
        return_rate = st.slider("Tasa devoluciones", 0.0, 0.5, prod_profile["return_rate"], 0.005)
        goodsin_pallets = st.number_input("Pallets recepción / mes", 0.0, value=0.0, step=0.5)
        storage_weeks = st.number_input("Pallet-weeks storage / mes", 0.0, value=0.0, step=0.5)

# Calculations
add_units = max(0.0, units_per_order - 1.0)
pick_rev = first_pick_price + add_units * add_pick_price
pick_cost = first_pick_cost + add_units * add_pick_cost
insert_rev = inserts_count * INSERT_PRICE_DEFAULT
insert_cost = inserts_count * INSERT_COST
return_rev = return_rate * RETURN_HANDLING_PRICE_DEFAULT
return_cost = return_rate * RETURN_HANDLING_COST

prep_plus_first_pick_price = pack_price_custom + first_pick_price
prep_plus_first_pick_cost = pack_cost_calc + first_pick_cost

order_rev_ex_ship = pick_rev + pack_price_custom + insert_rev + packaging_price + surcharge_price + return_rev
order_cost_ex_ship = pick_cost + pack_cost_calc + insert_cost + packaging_cost + surcharge_cost + return_cost

goodsin_rev = goodsin_pallets * GOODS_IN_PALLET_PRICE_DEFAULT
goodsin_cost = goodsin_pallets * GOODS_IN_PALLET_COST
storage_rev = storage_weeks * STORAGE_PALLET_PRICE_DEFAULT
storage_cost = storage_weeks * STORAGE_PALLET_COST

ship_rev_month = shipping_price * orders_month
ship_cost_month = carrier_cost * orders_month

fulfilment_rev_month = order_rev_ex_ship * orders_month + goodsin_rev + storage_rev
fulfilment_cost_month = order_cost_ex_ship * orders_month + goodsin_cost + storage_cost

total_rev = fulfilment_rev_month + ship_rev_month
total_cost = fulfilment_cost_month + ship_cost_month
total_profit = total_rev - total_cost

margin_total = margin_from_price(total_rev, total_cost)
margin_ex_ship = margin_from_price(fulfilment_rev_month, fulfilment_cost_month)
margin_ship = margin_from_price(ship_rev_month, ship_cost_month)

tab1, tab2, tab3 = st.tabs(["Resumen Cliente", "Desglose Operativo", "Rate Card"])

with tab1:
    st.subheader(f"Resumen de Cotización — {client_name}")
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Pedidos / mes", f"{int(orders_month):,}")
    col2.metric("Ingresos / mes", format_eur(total_rev))
    col3.metric("Beneficio / mes", format_eur(total_profit))
    col4.metric("Margen total", format_pct(margin_total))

    col5, col6, col7, col8 = st.columns(4)
    col5.metric("Margen sin envío", format_pct(margin_ex_ship))
    col6.metric("Margen envío", format_pct(margin_ship))
    col7.metric("Beneficio / pedido", format_eur(total_profit / orders_month if orders_month > 0 else 0))
    col8.metric("Prep. + 1er Pick", format_eur(prep_plus_first_pick_price))

    st.divider()
    st.subheader("Desglose Preparación y Picks")
    pcol1, pcol2, pcol3 = st.columns(3)
    pcol1.info(f"**Preparación base (Pack):** {format_eur(pack_price_custom)} (Coste: {format_eur(pack_cost_calc)})")
    pcol2.info(f"**1er Pick:** {format_eur(first_pick_price)} (Coste: {format_eur(first_pick_cost)})")
    pcol3.success(f"**Total Preparación + 1er Pick:** {format_eur(prep_plus_first_pick_price)} (Margen: {format_pct(margin_from_price(prep_plus_first_pick_price, prep_plus_first_pick_cost))})")

with tab2:
    st.subheader("Desglose Mensual por Línea")
    lines_data = [
        {"Línea": "Pack (Preparación base)", "Ingresos": pack_price_custom * orders_month, "Costes": pack_cost_calc * orders_month},
        {"Línea": "Pick (1er pick + adicionales)", "Ingresos": pick_rev * orders_month, "Costes": pick_cost * orders_month},
        {"Línea": "Inserts", "Ingresos": insert_rev * orders_month, "Costes": insert_cost * orders_month},
        {"Línea": "Packaging", "Ingresos": packaging_price * orders_month, "Costes": packaging_cost * orders_month},
        {"Línea": "Producto / Fragilidad", "Ingresos": surcharge_price * orders_month, "Costes": surcharge_cost * orders_month},
        {"Línea": "Returns", "Ingresos": return_rev * orders_month, "Costes": return_cost * orders_month},
        {"Línea": "Goods-in", "Ingresos": goodsin_rev, "Costes": goodsin_cost},
        {"Línea": "Storage", "Ingresos": storage_rev, "Costes": storage_cost},
        {"Línea": "Shipping (Carrier)", "Ingresos": ship_rev_month, "Costes": ship_cost_month},
    ]
    df = pd.DataFrame(lines_data)
    df["Beneficio"] = df["Ingresos"] - df["Costes"]
    df["Margen"] = df.apply(lambda r: f"{(r['Beneficio']/r['Ingresos'])*100:.1f}%" if r["Ingresos"] > 0 else "0.0%", axis=1)
    st.dataframe(df, use_container_width=True)
    st.bar_chart(df.set_index("Línea")[["Ingresos", "Costes"]])

with tab3:
    st.subheader("Valores Base del Rate Card")
    st.write(f"- Primer pick base: {BASE_FIRST_PICK_COST:.2f} €")
    st.write(f"- Pick adicional base: {BASE_ADDITIONAL_PICK_COST:.2f} €")
    st.write(f"- Inserts: {INSERT_PRICE_DEFAULT:.2f} €")
    st.write(f"- Goods-in pallet: {GOODS_IN_PALLET_PRICE_DEFAULT:.2f} €")
    st.write(f"- Almacenaje pallet/semana: {STORAGE_PALLET_PRICE_DEFAULT:.2f} €")
