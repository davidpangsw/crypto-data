from decimal import Decimal


def to_decimal(x) -> Decimal:
    return Decimal(str(x))

def apply_to_decimal(df, cols):
    for col in cols:
        df[col] =df[col].apply(to_decimal)
    return df