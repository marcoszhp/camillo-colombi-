DRIPPER_Z = 2.5
MILL_Z = 4.25

def add_stand(curve, material, parent):
    for side in (-1, 1):
        curve('Stand leg ' + str(side), [
            (side * 0.70, 0.25, -0.63),
            (side * 1.13, 0.38, -0.63),
            (side * 1.35, 0.50, -0.88),
            (side * 1.35, 0.50, -2.42)
        ], 0.055, material, parent)
        curve('Stand foot ' + str(side), [
            (side * 1.35, 0.08, -2.42),
            (side * 1.35, 0.92, -2.42)
        ], 0.055, material, parent)