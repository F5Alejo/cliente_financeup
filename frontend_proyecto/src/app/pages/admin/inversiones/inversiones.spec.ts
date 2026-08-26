    import { ComponentFixture, TestBed } from '@angular/core/testing';

    import { AdminInversionesComponent } from './inversiones';

    describe('AdminInversionesComponent', () => {
        let component: AdminInversionesComponent;
        let fixture: ComponentFixture<AdminInversionesComponent>;

        beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminInversionesComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminInversionesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    });